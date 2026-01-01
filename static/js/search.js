// 搜索功能
blog.addLoadEvent(function () {
  // 文章数据
  var posts = []
  // 上一次输入
  var keyBefore = ''
  // IOS 键盘中文输入bug
  var inputLock = false
  // 本地无缓存/站点重新编译，弹框阻塞，加载全文检索内容
  if (!localStorage.db || localStorage.dbVersion != blog.buildAt) {
    // 删除失效缓存
    if (localStorage.db) {
      localStorage.removeItem('db')
    }
    if (localStorage.dbVersion) {
      localStorage.removeItem('dbVersion')
    }
    var loadingDOM = document.querySelector('.page-search h1 img')
    loadingDOM.style.opacity = 1

    blog.ajax(
      {
        timeout: 20000,
        url: blog.baseurl + '/static/xml/search.json'
      },
      function (data) {
        localStorage.db = data
        localStorage.dbVersion = blog.buildAt
        initContentDB()
        search(document.querySelector('#search-input').value)
        loadingDOM.style.opacity = 0
      },
      function () {
        console.error('全文检索数据加载失败...')
      }
    )
  }

  if (localStorage.db) {
    initContentDB()
  }

  function initContentDB() {
    try {
      posts = JSON.parse(localStorage.db)
    } catch (e) {
      console.error('解析搜索数据失败:', e)
      posts = []
    }
  }

  function search(key) {
    key = blog.trim(key)
    if (key == keyBefore) {
      return
    }
    keyBefore = key

    var doms = document.querySelectorAll('.list-search li')
    var h1 = '<span class="hint">'
    var h2 = '</span>'

    for (let i = 0; i < posts.length && i < doms.length; i++) {
      var post = posts[i]
      var title = post.title || ''
      var content = post.content || ''
      var dom_li = doms[i]
      var dom_title = dom_li.querySelector('.title')
      var dom_content = dom_li.querySelector('.content')

      // 重置内容
      dom_title.textContent = title
      dom_content.textContent = ''

      // 空字符隐藏
      if (key == '') {
        dom_li.setAttribute('hidden', true)
        continue
      }

      var hide = true
      var escapedKey = blog.encodeRegChar(key)
      var r1 = new RegExp(escapedKey, 'gi')
      var r2 = new RegExp(escapedKey, 'i')

      // 标题全局替换
      if (r1.test(title)) {
        hide = false
        dom_title.innerHTML = blog.encodeHtml(title).replace(r1, h1 + blog.encodeHtml(key) + h2)
      }

      // 内容先找到第一个，然后确定100个字符，再对这100个字符做全局替换
      var cResult = r2.exec(content)
      if (cResult) {
        hide = false
        var index = cResult.index
        var leftShifting = 10
        var left = Math.max(0, index - leftShifting)
        var right = left + 100
        var snippet = content.substring(left, right)
        dom_content.innerHTML = blog.encodeHtml(snippet).replace(r1, h1 + blog.encodeHtml(key) + h2) + '...'
      }

      // 内容未命中标题命中，内容直接展示前100个字符
      if (!cResult && !hide && content) {
        dom_content.textContent = content.substring(0, 100) + '...'
      }

      if (hide) {
        dom_li.setAttribute('hidden', true)
      } else {
        dom_li.removeAttribute('hidden')
      }
    }
  }

  var input = document.getElementById('search-input')
  blog.addEvent(input, 'input', function (event) {
    if (!inputLock) {
      search(event.target.value)
    }
  })
  blog.addEvent(input, 'compositionstart', function () {
    inputLock = true
  })
  blog.addEvent(input, 'compositionend', function (event) {
    inputLock = false
    search(event.target.value)
  })
})

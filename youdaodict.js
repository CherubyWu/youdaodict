// ==UserScript==
// @id           youdao-cherub-2016-11-7
// @name         youdaodict
// @namespace    youdao
// @version      0.1
// @description  Translate English words to Chinese with Youdao.
// @description:zh-cn    使用有道翻译实现浏览器划词翻译
// @author       Cherub
// @include      *
// @grant        GM_xmlhttpRequest
// @require      https://cdn.staticfile.org/jquery/3.1.1/jquery.min.js
// ==/UserScript==

(function() {
  'use strict';

  String.prototype.strip = function() {
    return this.replace(/^\s+/, "").replace(/\s+$/, "");
  };

  // Main
  $(function() {
    $('body').click(translate);
    $('body').keydown(function(e) {
      switch (e.which) {
        case 27: //Esc
          // Press "Esc" toggle youdao window.
          $('.youdao-win').fadeToggle();
          break;
      }
    });
  });

  function translate(e) {
    var select, word, mouseX, mouseY;

    $('.youdao-win').fadeOut(function() {
      $(this).remove();
    });
    select = document.getSelection();

    // Is text node
    if (select.anchorNode && select.anchorNode.nodeType === 3) {
      word = select.toString().strip();
      if (word === '') {
        return;
      }
      word = word.replace('-\n', '');
      word = word.replace('\n', ' ');

      query(word, function(data) {
        showYoudaoWin(e.clientX, e.clientY, data);
      });
    }
  }

  // Show youdao window at (mouseX, mouseY)
  function showYoudaoWin(mouseX, mouseY, data) {
    var youdaoWin = $('<div/>').appendTo(document.body);
    youdaoWin.addClass('youdao-win');
    youdaoWin.click(function(e) {
      if (e.type === 'click') {
        // 在Youdao弹窗中点击不会关闭
        // 防止事件被Body捕捉
        e.stopPropagation();
      }
    });

    var header =
      $('<div/>')
      .addClass('youdao-win-header')
      .appendTo(youdaoWin);

    var searchLine = $('<input/>')
      .addClass('youdao-search-line')
      .attr('type', 'text')
      .appendTo(header);

    var searchBtn = $('<button/>')
      .attr('type', 'button')
      .addClass('youdao-search-btn')
      .click(function() {
        var w = searchLine.val().strip();
        if (w !== data.query.strip()) {
          query(w, showQueryInWindow);
        }
      })
      .html('Search')
      .appendTo(header);

    // Search word, if press 'Enter'
    searchLine.keypress(function(e) {
      switch (e.which) {
        case 13: // Enter
          searchBtn.click();
          break;
      }
    });

    $('<br/>').appendTo(header);

    $('<span/>')
      .addClass("youdao-query")
      .appendTo(header);

    $('<span/>')
      .addClass('youdao-phonetic')
      .appendTo(header);

    $('<a/>')
      .addClass('youdao-detail')
      .html('Detail')
      .appendTo(header);

    $('<hr/>')
      .appendTo(youdaoWin);

    var expains = $('<div/>')
      .addClass('.youdao-explains')
      .appendTo(youdaoWin);

    var expainsList = $('<ul/>')
      .addClass('youdao-explains-list')
      .appendTo(expains);

    $('<hr/>').appendTo(youdaoWin);

    var footer =
      $('<div/>')
      .addClass('youdao-win-footer')
      .appendTo(youdaoWin);

    $('<a/>')
      .addClass('youdao-search-image')
      .html('Pictures')
      .appendTo(footer);

    showQueryInWindow(data);

    // Pop window fade in.
    youdaoWin.hide().fadeIn();

    // 防止窗口太靠边而显示不全
    if (mouseY + youdaoWin.outerHeight() >= window.innerHeight) {
      youdaoWin.css('top',
        mouseY - (mouseY + youdaoWin.outerHeight() - window.innerHeight +
          20) +
        'px');
    } else {
      youdaoWin.css('top', mouseY + 'px');
    }

    if (mouseX + youdaoWin.outerWidth() >= window.innerWidth) {
      youdaoWin.css('left',
        mouseX - (mouseX + youdaoWin.outerWidth() - window.innerWidth +
          20) +
        'px');
    } else {
      youdaoWin.css('left', mouseX + 'px');
    }
  }

  function showQueryInWindow(data) {
    $('.youdao-query').html(data.query);
    $('.youdao-detail')
      .attr({
        href: `http://dict.youdao.com/search?q=${data.query}`,
        target: '_blank'
      });
    $('.youdao-search-image')
      .attr({
        href: `https://www.google.com.hk/search?q=${data.query}&tbm=isch`,
        target: '_blank'
      });
    $('.youdao-search-line').val(data.query);

    $('.youdao-explains-list').empty();
    if (data.basic) {
      word();
    } else {
      sentence();
    }

    applyCSS();

    function word() {
      $('.youdao-phonetic').off('click').hide();
      if (data.basic.phonetic) {
        $('.youdao-phonetic').html(` [${data.basic.phonetic}]`).show()
          .click(function() {
            play(data.query);
          });
      }
      data.basic.explains.map(addTrans);
    }

    function sentence() {
      data.translation.map(addTrans);
    }

    function addTrans(item) {
      $('<li/>')
        .addClass('youdao-explains-item')
        .html(item)
        .appendTo($('.youdao-explains-list'));
    }
  }

  function applyCSS() {
    $('.youdao-win').css({
      color: 'lightblue',
      fontSize: '1.2em',
      background: 'rgba(61, 61, 61, 0.9)',
      borderRadius: '5px',
      padding: '10px',
      display: 'block',
      position: 'fixed',
      zIndex: '99999'
    });

    $('.youdao-search-line').css({
      color: 'white',
      background: 'rgba(140, 191, 204, 0.5)',
      marginRight: '10px',
      marginBottom: '0.5em',
      padding: '3px',
      borderRadius: '5px'
    });

    $('.youdao-win button').css({
      borderRadius: '3px',
      padding: '3px',
      textTransform: 'capitalize',
      background: 'rgb(109, 178, 223)',
      border: 'none'
    }).mousedown(function() {
      $(this).css('background', 'rgb(109, 154, 186)');
    }).mouseup(function() {
      $(this).css('background', 'rgb(109, 178, 223)');
    });

    $('.youdao-phonetic')
      .css({
        color: 'rgb(251, 129, 129)',
        cursor: 'pointer'
      }).hover(
        function() {
          $(this).css('color', 'rgb(255, 131, 194)');
        },
        function() {
          $(this).css('color', 'rgb(251, 129, 129)');
        });

    $('.youdao-win a').css({
      fontSize: '0.7em',
      color: 'rgb(180, 175, 175)',
      textDecoration: 'none',
      float: 'right'
    });

    $('.youdao-win hr').css({
      clear: 'both',
      border: '0',
      borderBottom: '1px solid #ccc',
      width: '100%',
      margin: '0'
    });

    $('.youdao-win hr:first').css({
      marginTop: '3px',
      marginBottom: '0.7em'
    });

    $('.youdao-win hr:last').css({
      marginTop: '0.7em'
    });

    $('.youdao-explains-list').css({
      padding: '0'
    });

    $('.youdao-explains-item').css({
      listStyle: 'none',
      marginTop: '3px'
    });
  }

  function play(word) {
    var audio = document.createElement('audio');
    audio.src = `https://dict.youdao.com/dictvoice?type=2&audio=${word}`;
    audio.play();
  }

  function query(word, callback) {
    var url =
      `http://fanyi.youdao.com/openapi.do?type=data&doctype=json&version=1.1&relatedUrl=http%3A%2F%2Ffanyi.youdao.com%2F%23&keyfrom=fanyiweb&key=null&translate=on&q=${word}&ts=${new Date().getTime()}`;
    var ret = GM_xmlhttpRequest({
      method: "GET",
      url: url,
      headers: {
        "Accept": "application/json"
      },
      onload: function(res) {
        var retContent = res.response;
        callback(JSON.parse(retContent));
      },
      onerror: function(res) {
        console.log("error");
      }
    });
  }
})();

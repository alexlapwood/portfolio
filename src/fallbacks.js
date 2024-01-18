if (navigator.userAgent.match(/Android/i)) {

  var _heightChangeTolerance = 100; // Approximately URL bar height in Chrome on tablet
  var _viewportHeight = 0;

  function manageVH() {

    if (Math.abs(_viewportHeight - $(window).height()) > _heightChangeTolerance) {
      _viewportHeight = $(window).height();

      $('.background, nav, header, main .container, .portfolio, .projects .drop-tray, .projects .popup, header h1, .spacer').css({
        'height': '',
        'min-height': '',
        'padding-top': '',
        'padding-bottom': ''
      });

      $('.background, nav, header, .portfolio, .projects .drop-tray, .projects .popup').each(function() {
        $(this).css({
          'height': $(this).outerHeight()+'px',
          'padding-top': $(this).css('padding-top'),
          'padding-bottom': $(this).css('padding-bottom')
        });
      });

      $('header h1, main .container').each(function() {
        $(this).css({
          'padding-top': $(this).css('padding-top')
        });
      });

      $('.spacer').each(function() {
        $(this).css({
          'min-height': $(this).outerHeight()+'px'
        });
      });
    }
  }

  $(window).resize(function() {
    manageVH();
  });

  manageVH();
}

if('CSS' in window && 'supports' in window.CSS) {
    var support = window.CSS.supports('background-blend-mode','multiply');
    if (!support) {
      $('.hover').css({'background-image': 'none', 'background': 'rgba(0,0,0,0.75)'});
    }
}

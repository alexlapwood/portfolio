function toggleNavigationLinks(_popup) {
  var _active = _popup.find('.project.active');

  // Enable/disable popup navigation
  if (_popup.find('.project').index(_active) == 0) {
    _popup.children('.link-previous').addClass('disabled');
  } else {
    _popup.children('.link-previous').removeClass('disabled');
  }
  if (_popup.find('.project').index(_active) == _popup.find('.project').length - 1) {
    _popup.children('.link-next').addClass('disabled');
  } else {
    _popup.children('.link-next').removeClass('disabled');
  }
}

// Open project
$('body').on('click open', '.link-project', function(e) {

  // Scroll to the top if a project was opened manually
  if (e.type !== 'open') {
    $('html, body').animate({
      scrollTop: $('#portfolio').offset().top
    });
  }

  // Keep track of the link that was clicked
  var _this = $(this);

  // Find the popup container
  var _projects = $('.projects');

  // If the project popup is not yet open
  if (_projects.is(':hidden')) {

    // Find the popup
    var _popup = _projects.find('.popup');

    // Hide the popup
    _popup.hide();

    // Show the "drop" animation container
    _projects.find('.drop-tray').show();

    // Show the popup container
    $('.projects').show();

    // Prepare for the drop animation
    var parentOffset = _projects.find('.drop-tray').offset();
    var relX = e.pageX - parentOffset.left;
    var relY = e.pageY - parentOffset.top;
    var maxX = (relX > _projects.find('.drop-tray').outerWidth() / 2)?0:$('.projects .drop-tray').outerWidth();
    var maxY = (relY > _projects.find('.drop-tray').outerHeight() / 2)?0:$('.projects .drop-tray').outerHeight();

    var radius = Math.sqrt( (relX-maxX)*(relX-maxX) + (relY-maxY)*(relY-maxY) ) / 4;

    // Begin the drop animation
    _projects.find('.drop').css({top: relY, left: relX})
    _projects.find('.drop').velocity({scaleX: [radius, 0], scaleY: [radius, 0], opacity: [1, 0.25]}, 'easeIn', function() {

      // Switch the drop animation container out with the popup
      _projects.find('.drop-tray').hide();
      _popup.find('.project.active').removeClass('active');
      _popup.find('.close').css({opacity: 0});
      _popup.find('.close').velocity({opacity: [1,0]});
      _popup.show();

      // Show the selected project
      _projects.find('#project-' + _this.attr('id')).addClass('active initial');

      toggleNavigationLinks(_popup);
    });
  } else {

    var _popup = _projects.find('.popup');

    // Switch out the active element
    _popup.find('.initial').removeClass('initial');
    _popup.find('.project.active').removeClass('active');
    _popup.find('#project-' + _this.attr('id')).addClass('active');

    toggleNavigationLinks(_popup);
  }
});

// Navigate to the previous project
$('body').on('click', '.popup>.link-previous', function() {
  $('html, body').animate({
    scrollTop: $('#portfolio').offset().top
  });

  var _popup = $(this).closest('.popup');
  var _active = _popup.find('.project.active');

  _popup.find('.initial').removeClass('initial');

  // Switch out the active element
  if (_active.prev('.project').length > 0) {
    _active.removeClass('active');
    _active.prev('.project').addClass('active');
  }

  toggleNavigationLinks(_popup);
});

// Navigate to the next project
$('body').on('click', '.popup>.link-next', function() {
  $('html, body').animate({
    scrollTop: $('#portfolio').offset().top
  });

  var _popup = $(this).closest('.popup');
  var _active = _popup.find('.project.active');

  _popup.find('.initial').removeClass('initial');

  // Switch out the active element
  if (_active.next('.project').length > 0) {
    _active.removeClass('active');
    _active.next('.project').addClass('active');
  }

  toggleNavigationLinks(_popup);
});

// Close the project
$('body').on('click close', '.projects .popup .close:visible', function(e) {

  // Find out what popup container was closed
  var _projects = $(this).closest('.projects');

  // Disable the popup navigation
  _projects.find('.popup>.link-previous, .popup>.link-next').addClass('disabled');

  // Fade and drop the box
  _projects.velocity({opacity: [0, 1], 'margin-top': '1rem'}, function() {
    _projects.css({opacity: 1, 'margin-top': 0});
    _projects.hide();
  });
});

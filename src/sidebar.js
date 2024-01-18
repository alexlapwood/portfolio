function openMenu() {
  $('.hamburger, nav').addClass('open');
}

function closeMenu() {
  $('.hamburger, nav').removeClass('open');
}

$('body').on('swipeleft', function(e) {
  openMenu();
});

$('body').on('swiperight', function(e) {
  if ($('.hamburger').hasClass('open')) {
    closeMenu();
  } else {
    // do cool stuff
  }
});

// Open and close the side menu
$('body').on('click', '.hamburger', function() {

  // Toggle the "open" class
  if ($(this).hasClass('open')) {
    closeMenu();
  } else {
    openMenu();
  }

});

$(document).on('click', function(e) {
  if (!$(e.target).closest('.hamburger, nav').length) {
    closeMenu();
  }

  if (!$(e.target).closest('.popup').length && !$(e.target).closest('.link-project').length) {
    $('.popup .close').trigger('close');
  }
});

// Navigate to an area on the page
$('body').on('click', 'nav ul li', function() {

  closeMenu();

  // Cache the object clicked
  var _this = $(this);

  // Scroll down the page
  $('html, body').animate({
    scrollTop: $('#' + _this.attr('id').substr(4)).offset().top
  });

});

// Cache positions and heights
//var cache_contactBottom = $('#contact').offset().top + $('#contact').outerHeight() - 1;
//var cache_testimonialsBottom = $('#testimonials').offset().top + $('#testimonials').outerHeight() + $('#testimonials+.row').outerHeight() - 1;
var cache_scrollTop = 0;

// Run this function on every animation frame
function step() {

  // Check if the window has scrolled since the last frame
  if (cache_scrollTop !== $(window).scrollTop()) {
    cache_scrollTop = $(window).scrollTop();

    // Parallax header background
    //$('header').css('background-position', '0px ' + cache_scrollTop / 4 + 'px');

    // Prep a placeholder target that will be the indicator for the current section
    var _this;

    // Deselect all navigation elements
    $('nav ul li').removeClass('active');

    // Determine which area we are currently scrolled to and select the relative navigation element
    if(cache_scrollTop + window.innerHeight >= $('#contact').offset().top + $('#contact').outerHeight() - 1) {
      _this = $('#contact');
      $('#nav-contact').addClass('active');
    } else if(cache_scrollTop + window.innerHeight / 2 >= $('#testimonials').offset().top) {
      _this = $('#testimonials');
      $('#nav-testimonials').addClass('active');
    } else if(cache_scrollTop + window.innerHeight / 2 >= $('#portfolio').offset().top) {
      _this = $('#portfolio');
      $('#nav-portfolio').addClass('active');
    } else {
      if (window.location.hash != '') {
        if (history.replaceState) {
          history.replaceState({}, document.title, '.');
        } else {
          _this = $('#about');
        }
      }
      $('#nav-about').addClass('active');
    }

    // Update the URL hash based on the indicator for the current section (_this)
    if (typeof _this !== 'undefined') {
      var _id = _this.attr('id');
      _this.attr('id', _id+'-temp')
      window.location.hash = _id;
      _this.attr('id', _id);
    }
  }

  requestAnimationFrame(step);
};

requestAnimationFrame(step);

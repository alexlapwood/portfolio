// Navigate to the previous element
$('body').on('click', '.pagination .link-previous', function() {

  var _currentPage = $(this).closest('.pagination').find('.current-page');
  var _container = $(this).closest('.pagination').prev();
  var _active = _container.find('.active');


  // Switch out the active element
  if (_active.prev().length > 0) {

    // Remove the active class from the old element
    _active.removeClass('active');

    // Determine the new element
    _active.prev().addClass('active');

  }

  // Update current page number
  _currentPage.html(_container.find('.active').index() + 1);

  // Disable navigation if needed
  if (_container.find('.active').index() == 0) {
    $(this).closest('.pagination').find('.link-previous').addClass('disabled');
  } else {
    $(this).closest('.pagination').find('.link-previous').removeClass('disabled');
  }
  if (_container.find('.active').index() == _container.children().length - 1) {
    $(this).closest('.pagination').find('.link-next').addClass('disabled');
  } else {
    $(this).closest('.pagination').find('.link-next').removeClass('disabled');
  }
});

// Navigate to the next element
$('body').on('click', '.pagination .link-next', function() {

  var _currentPage = $(this).closest('.pagination').find('.current-page');
  var _container = $(this).closest('.pagination').prev();
  var _active = _container.find('.active');

  // Switch out the active element
  if (_active.next().length > 0) {

    // Remove the active class from the old element
    _active.removeClass('active');

    // Determine the new element
    _active.next().addClass('active');
  }

  // Update current page number
  _currentPage.html(_container.find('.active').index() + 1);

  // Disable navigation if needed
  if (_container.find('.active').index() == 0) {
    $(this).closest('.pagination').find('.link-previous').addClass('disabled');
  } else {
    $(this).closest('.pagination').find('.link-previous').removeClass('disabled');
  }

  if (_container.find('.active').index() == _container.children().length - 1) {
    $(this).closest('.pagination').find('.link-next').addClass('disabled');
  } else {
    $(this).closest('.pagination').find('.link-next').removeClass('disabled');
  }
});

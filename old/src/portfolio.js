$(document).ready(function () {
  var a = "alex";
  var c = "com";
  var g = "gmail";
  var l = "lap";
  var m = "mail";
  var t = "to";
  var w = "wood";

  setTimeout(function () {
    $(".email").attr("href", m + t + ":" + a + l + w + "@" + g + "." + c);
    $(".email").html(a + l + w + "@" + g + "." + c);
  }, 1000);

  // Recalculate testimonial heights
  var _maxHeight = -1;
  $(".testimonial").each(function () {
    $(".testimonial").css({ height: "" });
    if ($(this).outerHeight() > _maxHeight) {
      _maxHeight = $(this).outerHeight();
    }
  });

  $(".testimonials").css({ height: _maxHeight });
  $(".testimonial").css({ height: "100%" });

  $.getJSON("projects.json", function (data) {
    var _projects = data.projects;

    for (var i = 0; i < _projects.length; i++) {
      var _html = "";

      _html +=
        '<div class="preview valign-wrapper" style="background-image: url(\'img/' +
        _projects[i].id +
        "/thumbnail.jpg');\">";
      _html +=
        '  <div id="' +
        _projects[i].id +
        '" class="hover link-project valign align-center" style="background-image: url(\'img/' +
        _projects[i].id +
        "/thumbnail-hover.jpg'), linear-gradient( 0deg, rgb(35,119,191) 0%, rgb(139,46,159) 100%);\">";
      _html += "    <h2>" + _projects[i].title + "</h2>";
      _html += "    <p>" + _projects[i].subtitle + "</p>";
      _html += "    <span>Learn More &gt;</a>";
      _html += "  </div>";
      _html += "</div>";

      $(".portfolio").children().eq(i).html(_html);
    }

    for (var i = 0; i < _projects.length; i++) {
      var _html = "";

      _html = "";

      _html += '<div id="project-' + _projects[i].id + '" class="project">';
      _html += '  <div class="row">';
      _html += '    <div class="title col xs12 m3 align-right">';
      _html += "      <h2>&lt;" + _projects[i].title + "&gt;</h2>";
      _html += "      <p>&lt;" + _projects[i].subtitle + "&gt;</p>";
      _html += "    </div>";
      _html += '    <div class="description col xs12 m6 offset-m3">';
      _html += "      <p>" + _projects[i].description + "</p>";
      _html +=
        '      <a href="' +
        _projects[i].url +
        '" target="_blank">' +
        _projects[i].display_url +
        "</a>";

      _html += '      <div class="screenshots">';

      if (_projects[i].desktopOnly) {
        for (var j = 0; j < _projects[i].screenshots.length; j++) {
          _html +=
            '<div class="screenshot' + (j == 0 ? " active" : "") + ' row">';
          _html += '  <div class="height-fix"></div>';
          _html += '  <div class="col scrollable fullscreen-wrapper-wrapper">';
          _html += '    <div class="fullscreen-wrapper">';
          _html +=
            '      <img class="fullscreen" src="img/' +
            _projects[i].id +
            "/screenshots/" +
            _projects[i].screenshots[j] +
            '.png" alt="' +
            _projects[i].screenshots[j] +
            '" />';
          _html += "    </div>";
          _html += "  </div>";
          _html += "</div>";
        }
      } else {
        for (var j = 0; j < _projects[i].screenshots.length; j++) {
          _html +=
            '<div class="screenshot' + (j == 0 ? " active" : "") + ' row">';
          _html += '  <div class="height-fix"></div>';
          _html += '  <div class="col xs8 scrollable">';
          _html +=
            '    <img src="img/' +
            _projects[i].id +
            "/screenshots/desktop/" +
            _projects[i].screenshots[j] +
            '.jpg" alt="' +
            _projects[i].screenshots[j] +
            '" />';
          _html += "  </div>";
          _html += '  <div class="col xs4 scrollable">';
          _html +=
            '    <img src="img/' +
            _projects[i].id +
            "/screenshots/mobile/" +
            _projects[i].screenshots[j] +
            '.jpg" alt="' +
            _projects[i].screenshots[j] +
            ' (Mobile)" />';
          _html += "  </div>";
          _html += "</div>";
        }
      }
      _html += "      </div>";
      _html += '      <div class="pagination">';
      _html +=
        '        <i class="link-previous disabled fa fa-long-arrow-left"></i>';
      _html +=
        '        <span class="page-number"><span class="current-page disabled">1</span> - <span class="page-count">' +
        _projects[i].screenshots.length +
        "</span></span>";
      _html +=
        '        <i class="link-next' +
        (_projects[i].screenshots.length > 1 ? "" : " disabled") +
        ' fa fa-long-arrow-right"></i>';
      _html += "      </div>";
      _html += "    </div>";
      _html += "  </div>";
      _html += "</div>";

      $(".projects .popup .container").append(_html);
    }

    if (
      (window.innerWidth < 680 || window.innerHeight < 600) &&
      $(".projects:visible").length == 0
    ) {
      $(".portfolio .hover.link-project").first().trigger("open");
    }
  });
});

$("body").on("click", ".scroll-down", function () {
  $("html, body").animate({
    scrollTop: $("#portfolio").offset().top,
  });
});

$(window).resize(function () {
  // Toggle permanent project popup
  if (
    (window.innerWidth < 680 || window.innerHeight < 600) &&
    $(".projects:visible").length == 0
  ) {
    $(".portfolio .hover.link-project").first().trigger("open");
  }

  if (this.resizeTo) {
    clearTimeout(this.resizeTo);
  }
  this.resizeTo = setTimeout(function () {
    $(this).trigger("resizeEnd");
  }, 500);
});

$(window).on("resizeEnd", function () {
  // Recalculate testimonial heights
  var _maxHeight = -1;
  $(".testimonial").each(function () {
    $(".testimonial").css({ height: "" });
    if ($(this).outerHeight() > _maxHeight) {
      _maxHeight = $(this).outerHeight();
    }
  });

  $(".testimonials").css({ height: _maxHeight });
  $(".testimonial").css({ height: "100%" });
});

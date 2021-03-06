var WIU = WIU || {};

WIU.animate = (function() {

  var 
  breakWords = function($wordsDiv, callback) {
    var words = $wordsDiv.attr('data-id');

    if (typeof words === 'string' && words.trim() !== '') {
      var wordsArr = words.trim().split(' ');

      $.each(wordsArr, function(index, word) {
        var $newDiv = $('<div class="wiu-animate">' + word + '</div>');
        $wordsDiv.append($newDiv);
      });

      callback($wordsDiv);
    }
  },
  getNextStagger = function(stagger, lastIndex) {
    return stagger * lastIndex;
  },
  apply = function($div, effect, callback) {
    if (effect !== '') {
      $div.addClass('animated ' + effect);

      $div.off('oanimationend animationend webkitAnimationEnd').on('oanimationend animationend webkitAnimationEnd', function() {
        $div.removeClass('animated ' + effect);

        if (typeof callback === 'function') {
          callback();
        }
      })
    }
  },
  bounceWords = function($wordsDiv, stagger, callback) {
    stagger = typeof stagger !== 'undefined' ? stagger : 0;    

    breakWords($wordsDiv, function() {
      var $toBounce = $wordsDiv.find('.wiu-animate');

      $toBounce.each(function(index) {
        var $this = $(this); 
        setTimeout(function() {
          apply($this, 'bounce');
        }, stagger * index);
      });

      if (typeof callback === 'function') {
        var nextStagger = getNextStagger(stagger, $toBounce.length);
        setTimeout(function() {
          callback();
        }, nextStagger);
      }
      
    });
  },
  slideIn = function($divs) {
    var timeline = new TimelineLite({paused: true});

    $divs.each(function(index) {
      var $this = $(this);
      timeline.fromTo($this, 0.3, 
            {opacity: 0, right: -90}, 
            {opacity: 1, right: 0});
    });

    timeline.play();
    
  },
  bkgSlideIn = function($div) {
    var timeline = new TimelineLite({paused: true}),
        startVal = $div.css('backgroundPosition');

    timeline.fromTo($div, 0.6, 
          {opacity: 0, backgroundPosition: startVal}, 
          {opacity: 1, backgroundPosition: '50% 100%'});    

    timeline.play();
  },
  getRand = function(min, max) {
    return Math.floor(Math.random()*(max-min+1)+min);
  },
  getRandEffect = function() {
    var effects = ['hinge', 'rollOut', 'zoomOutDown', 'bounceOut'];
    return effects[getRand(0, effects.length-1)];
  },
  leavePage = function(url) {
    var $wrapper = $('.wrapper'),
        effect = getRandEffect();

    apply($wrapper, effect, function() {
      $wrapper.css( "display", "none" );
      window.location = url;  
    });
  };

  return {
    bounceWords : bounceWords,
    apply : apply,
    slideIn : slideIn,
    bkgSlideIn : bkgSlideIn,
    leavePage : leavePage
  }
})();
var WIU = WIU || {};

WIU.createEvent = (function() {

  var 
  isSimilar = function(original, formatted) {
    var ogArr = original.split(' '),
        total = ogArr.length,
        matched = 0;

    $.each(ogArr, function(index, word) {
      if (formatted.indexOf(word) !== -1) {
        matched++;
      }
    });

    return (matched/total).toFixed(2);
  },
  geocodeAddress = function(location, callback) {
    var apiKey = 'AIzaSyCdPObqQECeLB2K0xW96U8Rhzd3sFS9d4k',
        address = location.split(' ').join('+'),
        apiURL = 'https://maps.googleapis.com/maps/api/geocode/json?components=country:US&',
        requestURL = apiURL + 'address=' + address + '&key=' + apiKey,
        addressObj = {};

    $.ajax({
      method: "GET",
      url: requestURL
    })
    .done(function(data) {
      if (data.status === 'OK' && data.results.length == 1) {
        var lat = data.results[0].geometry.location.lat,
            lng = data.results[0].geometry.location.lng,
            placeID = data.results[0].place_id,
            formattedAddy = data.results[0].formatted_address;

        addressObj.latlng     = lat +', ' + lng;
        addressObj.placeID    = placeID;
        addressObj.formatted  = formattedAddy;
      }
      else {
        console.log('problem geocoding', data);
      }

      if (typeof callback == 'function') {
        callback(addressObj);
      }

    });
  },
  showSuggestion = function(addressObj) {
    var $suggestDiv = $('.address-suggest-div'),
        $addyDiv = $('.address-suggest', '.address-suggest-div'),
        $suggestCB = $('.suggest-cb', '.address-suggest-div');

    // clear check box and hide suggestion
    $suggestCB.prop('checked', false);
    $suggestDiv.addClass('hidden');

    if (typeof addressObj.formatted !== 'undefined' && addressObj.formatted != '') {
      $addyDiv.html(addressObj.formatted);
      $suggestDiv.removeClass('hidden');
    }
  },
  initAddressComplete = function() {
    var $location = $('.location', '.create-events-page');

    $location.on('blur', function() {

      var address = $location.val();

      if (typeof address !== 'undefined' && address.trim() != '' && address.trim().length > 1) {
        geocodeAddress(address.trim(), function(obj) {
          fillHiddenFields(obj);
          showSuggestion(obj);
        });
      }
      
    })
  },
  initDatepicker = function() {
    $('#event-date').datepicker();
  },
  verifyData = function(obj) {
    return !(typeof(obj.name) === 'undefined' || obj.name === null || obj.name.trim() === '');
  },
  fillHiddenFields = function(obj){ 
    var page = '.create-events-page',
        $placeID = $('.place-id', page),
        $latlong = $('.latlong', page),
        $formatted = $('.formatted-addy', page);

    if (typeof obj.placeID !== 'undefined' && typeof obj.latlng !== 'undefined' &&
        typeof obj.formatted !== 'undefined') {
      $placeID.val(obj.placeID);
      $latlong.val(obj.latlng);
      $formatted.val(obj.formatted);  
    }
    else {
      $placeID.val('');
      $latlong.val('');
      $formatted.val('');
    }
  },
  getHostInfo = function() {
    var $hostName = $('.host-name'),
        $hostID = $('.host-id'),
        host = {
          id    : 1,
          name  : 'Gorilla Gang'
        };

    if ($hostName.length && $hostID.length) {
      host = {
        id    : $hostID.val(),
        name  : $hostName.val()
      };
    }
    return host;
  },
  getEventCategory = function() {
    var categories = $('.event-category'),
        checkedCategories = [];

    for (var i = 0; i < categories.length; i++) {
      if ($(categories[i]).is(':checked')) checkedCategories.push(
        parseInt(categories[i].value)
      );
    }

    if (checkedCategories.length == 0) {
      checkedCategories.push(7);
    }

    return checkedCategories;
  },
  getData = function() {
    var page = '.create-events-page',
        eventName = $('.event-name', page).val(),
        eventDate = $('.event-date', page).val(),
        eventTime = $('.start-time', page).val(),
        location  = $('.location', page).val(),
        eventDesc = $('.event-desc', page).val(),
        isPrivate = $('.is-private-cb', page).is(':checked'),
        hostObj = getHostInfo(),
        checkedCategories = getEventCategory();

        suggestCB = $('.suggest-cb', page).is(':checked'),
        locationObj = {
          name : location
        };

    if (suggestCB) {
      locationObj.placeID = $('.place-id', page).val();
      locationObj.latlng  = $('.latlong', page).val();
      locationObj.formatted = $('.formatted-addy', page).val();
    }

    return {
      name      : eventName,
      date      : eventDate,
      time      : eventTime,
      location  : location,
      description : eventDesc,
      isPrivate   : isPrivate,
      host      : hostObj.name,
      hostId    : hostObj.id,
      geoData   : locationObj,
      categories: JSON.stringify(checkedCategories)
    };
  },
  initCreateBtn = function() {
    var $createBtn = $('.create-btn');

    $createBtn.on('click', function(e) {
      var eventObj = getData();

      if (verifyData(eventObj)) {
        $.ajax({
          method: 'POST',
          url: './event/createevent',
          data: eventObj
        })
        .done(function(res) {
          var eventID = parseInt(res.id);
          WIU.animate.leavePage('/event/' + eventID);
        })
        .fail(function(res, status, xhr) {
          console.log('An error occured', res);
        });
      }
      else {
        // throw warning!
        $('.error-name').removeClass('hidden');

        return false;
      }

    });
  },
  init = function() {
    if ($('.create-events-page').length) {
      initDatepicker();
      initCreateBtn();
      initAddressComplete();
    }
  };

  return {
    init : init
  }
})();

$(function() {
  WIU.createEvent.init();
});
var WIU = WIU || {};

WIU.event = (function () {

  var
    bindFacebookShare = function() {
      var $fbBtn = $('.fb-btn'),
      currentURL = window.location.href,
      shareURL = 'https://www.facebook.com/sharer/sharer.php?u=';
      
      $fbBtn.attr('href', shareURL + currentURL);
    },
    verifyData = function(obj) {
      return !(typeof(obj.name) === 'undefined' || obj.name === null || obj.name.trim() === '');
    },
    isInvited = false,
    bindUpdateButton = function() {
      $('.update-btn', '.button-row').on('click', function(e) {
        var eventObj = getData();
        if (verifyData(eventObj)) {

          // return false;
          $.ajax({
            method: 'POST',
            url: '/event/updateevent',
            data: eventObj
          }).done(function(res) {
            WIU.animate.leavePage(window.location.href);
            // console.log('updated successful');
          });
        }
        else {
          $('.error-name').removeClass('hidden');

          return false;
        }
        
      });
    },
    bindDeleteButton = function() {
      $('.delete-btn', '.button-row').on('click', function(e) {
        $.ajax({
          method: 'DELETE',
          url: '/event/delete/' + window.location.href.match(/\d*$/)[0]
        }).done(function(res) {
          WIU.animate.leavePage('/profile/getuser/' + $('#hostLabel').attr('data-id'));
        });
      });
    },
    getLatLong = function() {
      return $('.latlong').val();
    },
    readyStaticMap = function() {
      var key = 'AIzaSyAxQrQpPeVTP0SFDubCMCNtDaRqOjM-fxk',
          latlong = getLatLong(),
          url = '',
          $map = $('.map-image', '.map');

      latlong = latlong || '-33.8569,151.2152';
      url = "https://maps.googleapis.com/maps/api/staticmap?markers=" + latlong + "&center=" + latlong + "&zoom=12&size=350x200&key=" + key;

      if ($map.length) {
        $map.attr('src', url);
      }
    },
    // TODO: q=place_id:......
    readyGoogleMap = function() {
      var key = 'AIzaSyCmiSi2gWmkkVWPwz-lk8N1Htd4Q50-Qz4',
      url = "https://www.google.com/maps/embed/v1/search?key=" + key + '&zoom=18&center=',
      latlong = getLatLong();
      
      // TODO: remove this when we have backend
      latlong = latlong || '-33.8569,151.2152';
      
      if (latlong) {
        url += latlong;
        url += '&q=' + 'Fairmont+Empress,Victoria+BC',
        $('.g-map').attr('src', url);
      }
      else {
        // no map
      }
    },
    getEventCategory = function() {
      var categories = $('.event-category'),
          checkedCategories = [];

      for (var i = 0; i < categories.length; i++) {
        if ($(categories[i]).is(':checked')) checkedCategories.push(
          parseInt(categories[i].value)
        );
      }

      if (checkedCategories.length == 0) {
        checkedCategories.push(7);
      }

      return checkedCategories;
    },
    getData = function() {
      var page = '.event-page',
          eventName = $('.event-name', page).val(),
          eventDate = $('.event-date', page).val(),
          eventTime = $('.start-time', page).val(),
          location  = $('.location', page).val(),
          eventDesc = $('.event-desc', page).val(),
          isPrivate = $('.is-private-cb', page).is(':checked'),
          checkedCategories = getEventCategory();

          suggestCB = $('.suggest-cb', page).is(':checked'),
          locationObj = {
            name : location
          };

      if (suggestCB) {
        locationObj.placeID = $('.place-id-new', page).val();
        locationObj.latlng  = $('.latlong-new', page).val();
        locationObj.formatted = $('.formatted-addy-new', page).val();
      }
      else {
        locationObj.placeID = $('.place-id', page).val();
        locationObj.latlng  = $('.latlong', page).val();
        locationObj.formatted = $('.formatted-addy', page).val();
      }

      return {
        name      : eventName,
        date      : eventDate,
        time      : eventTime,
        location  : location,
        description : eventDesc,
        isPrivate   : isPrivate,
        geoData   : locationObj,
        categories: JSON.stringify(checkedCategories),
        invite    : {
          username  : $('#inviteUser').val(),
          eventId   : window.location.href.match(/\d*$/)[0],  
        }
      };
    },
    populateAutocomplete = function() {
      var userNames = [];
      $.ajax({
        method: 'GET',
        url: '../profile/'
      }).done(function(users) {
        for(var i = 0; i < users.length; i++) {
          userNames.push(users[i].username);
        }
        $('#inviteUser').autocomplete({
          minLength: 3,
          delay: 50,
          appendTo: '#inviteUserSearchContainer',
          source: userNames
        });
      });
    },
    geocodeAddress = function(location, callback) {
      var apiKey = 'AIzaSyCdPObqQECeLB2K0xW96U8Rhzd3sFS9d4k',
          address = location.split(' ').join('+'),
          apiURL = 'https://maps.googleapis.com/maps/api/geocode/json?components=country:US&',
          requestURL = apiURL + 'address=' + address + '&key=' + apiKey,
          addressObj = {};

      $.ajax({
        method: "GET",
        url: requestURL
      })
      .done(function(data) {
        if (data.status === 'OK' && data.results.length == 1) {
          var lat = data.results[0].geometry.location.lat,
              lng = data.results[0].geometry.location.lng,
              placeID = data.results[0].place_id,
              formattedAddy = data.results[0].formatted_address;

          addressObj.latlng     = lat +', ' + lng;
          addressObj.placeID    = placeID;
          addressObj.formatted  = formattedAddy;
        }
        else {
          console.log('problem geocoding', data);
        }

        if (typeof callback == 'function') {
          callback(addressObj);
        }
      });
    },
    showSuggestion = function(addressObj) {
      var $suggestDiv = $('.address-suggest-div'),
          $addyDiv = $('.address-suggest', '.address-suggest-div'),
          $suggestCB = $('.suggest-cb', '.address-suggest-div');

      // clear check box and hide suggestion
      $suggestCB.prop('checked', false);
      $suggestDiv.addClass('hidden');

      if (typeof addressObj.formatted !== 'undefined' && addressObj.formatted != '') {
        $addyDiv.html(addressObj.formatted);
        $suggestDiv.removeClass('hidden');
      }
    },
    fillHiddenFields = function(obj){ 
      var page = '.event-page',
          $placeID = $('.place-id-new', page),
          $latlong = $('.latlong-new', page),
          $formatted = $('.formatted-addy-new', page);

      if (typeof obj.placeID !== 'undefined' && typeof obj.latlng !== 'undefined' &&
          typeof obj.formatted !== 'undefined') {
        $placeID.val(obj.placeID);
        $latlong.val(obj.latlng);
        $formatted.val(obj.formatted);  
      }
      else {
        $placeID.val('');
        $latlong.val('');
        $formatted.val('');
      }
    },
    initAddressComplete = function() {
      var $location = $('.location', '.edit-event');

      $location.on('blur', function() {

        var address = $location.val();

        if (typeof address !== 'undefined' && address.trim() != '' && address.trim().length > 1) {
          geocodeAddress(address.trim(), function(obj) {
            fillHiddenFields(obj);
            showSuggestion(obj);
          });
        }
      });
    },
    updateCTA = function(status) {
      if (status === 'G') { // show cancel RSVP btn
        $('.rsvp-btn', '.cta').addClass('hidden');
        $('.cancel-rsvp-btn', '.cta').removeClass('hidden');
      }
      else { // show RSVP btn
        $('.rsvp-btn', '.cta').removeClass('hidden');
        $('.cancel-rsvp-btn', '.cta').addClass('hidden');
      }
    },
    initCTA = function() {
      if (isInvited) {
        updateCTA('G');
      }
      else {
        updateCTA();
      }
    },
    updateInvite = function(obj) {
      $.ajax({
        method: 'PUT',
        url: '/event/updatestatus',
        data: {
          status: obj.status,
          eventId: obj.eventId,
          userId: obj.userId,
        }
      }).done(function(res) {
        updateCTA(obj.status);
      });
    },
    cancelInvite = function(obj) {
      $.ajax({
        method: 'PUT',
        url: '/event/uninvite',
        data: {
          eventId: obj.eventId,
          userId: obj.userId,
        }
      }).done(function(res) {
        updateCTA(obj.status);
      });
    },
    userIsInvited = function(callback) {

      var userID = parseInt($('.user-id', '.event-page').val());

      $.ajax({
        method: 'POST',
        url: '/event/userisinvited',
        data: {
          userId: userID,
          eventId: window.location.href.match(/\d*$/)[0]
        }
      })
      .done(function(res) {
        if (res == true) {
          isInvited = true;
        }
        else {
          isInvited = false;
        }

        if (typeof callback === 'function') {
          callback();
        }
      });
    },
    bindRSVPBtn = function () {
      var $rsvpBtn = $('.rsvp-btn', '.event-page');

      $rsvpBtn.on('click', function() {
        var userID = parseInt($(this).attr('data-uid'));

        if (isInvited) {
          updateInvite({
            status  : 'G',
            eventId : window.location.href.match(/\d*$/)[0],
            userId  : userID,
          });
        }
        else {
          $.ajax({
            method: 'POST',
            url: '/event/addinvite',
            data: {
              username: $('.username').val(),
              eventId: window.location.href.match(/\d*$/)[0]
            }
          })
          .done(function(res) {
            updateInvite({
              status  : 'G',
              eventId : window.location.href.match(/\d*$/)[0],
              userId  : userID,
            });
          });
        }
      });
    },
    bindCancelRSVPBtn = function() {
      var $cancelBtn = $('.cancel-rsvp-btn', '.event-page');

      $cancelBtn.on('click', function() {
        var userID = parseInt($(this).attr('data-uid'));

        cancelInvite({
          status  : 'U',
          eventId : window.location.href.match(/\d*$/)[0],
          userId  : userID,
        });
      });
    },
    init = function () {
      if ($('.event-page').length) {
        userIsInvited(function() {
          initCTA();
          bindFacebookShare();
          bindUpdateButton();
          bindDeleteButton();
          populateAutocomplete();
          readyStaticMap();
          initAddressComplete();
          bindRSVPBtn();
          bindCancelRSVPBtn();
        });
      }
    };

  return {
    init: init,
    readyMap : readyGoogleMap
  }
})();

$(window).on('load', function() {
  if ($('.event-page').length) {
    WIU.event.readyMap();
  }
});


$(function () {
  WIU.event.init();
});


var WIU = WIU || {};

WIU.events = (function () {

  var
    
    init = function () {
      if ($('.events-page').length) {
        var $events = $('.event-row');

        WIU.animate.slideIn($events);
      }
    };

  return {
    init: init
  }
})();

$(function () {
  WIU.events.init();
});
var WIU = WIU || {};

WIU.findEvents = (function() {

  var 
  initDatepicker = function() {
    $('#start-date').datepicker();
  },
  hideAdvOptions = function(speed, callback) {
    var $advFilters = $('.advance-filters');

    speed = speed || 'fast';
    $advFilters.hide(speed, 'linear');
    $advFilters.addClass('hide');

    if (typeof callback === 'function') {
      callback();  
    }
  },
  showAdvOptions = function(speed) {
    var $advFilters = $('.advance-filters');

    speed = speed || 'fast';
    $advFilters.show(speed, 'linear');
    $advFilters.removeClass('hide');
  },
  getEventCategory = function() {
    var categories = $('.event-category'),
        checkedCategories = [];

    for (var i = 0; i < categories.length; i++) {
      if ($(categories[i]).is(':checked')) checkedCategories.push(
        parseInt(categories[i].value)
      );
    }

    if (checkedCategories.length == 0) {
      checkedCategories.push(7);
    }

    return checkedCategories;
  },
  initAdvOptions = function() {
    var $advOptsLink = $('.toggle-advance-options');

    $advOptsLink.on('click', function(e) {
      e.preventDefault();

      var $advFilters = $('.advance-filters');

      if ($advFilters.hasClass('hide')) {
        $('.advance-option').html('hide advance options');
        showAdvOptions(300);
      }
      else {
        $('.advance-option').html('advance options');
        hideAdvOptions(300);
      }
    });
  },
  findEvent = function () {
    var findEvent = $('.event-search-box').val();
    if (findEvent === "") {
      return false;
    } else {
      return true;
    }
  },
  bindFindBtn = function () {
    var $findBtn = $('.find-btn');

    $findBtn.on('click', function () {
      var checkedCategories = getEventCategory();

      // console.log('hey', checkedCategories.join('+'));
      window.location = './event/bycategory/?cid=' + checkedCategories.join('+');
    });
  },

  init = function() {
    if ($('.find-events-page').length) {
      initDatepicker(); 
      initAdvOptions();
      bindFindBtn();
    }
  };

  return {
    init : init
  }
})();

$(function() {
  WIU.findEvents.init();
});
var WIU = WIU || {};

WIU.header = (function () {

  var
  // working with all the functions
    init = function () {
      if ($('.site-header.nav').length) {
        bindLogOut();
        bindSignin();
        bindHoverAnimation();
      }
    },
    processLogin = function() {
      var $result = $('#signInResult');

      putSpinner();

      if (!validate()) {
        $result.text("Sorry! This email is not a valid email address");
        removeSpinner();
      }
      else if (emptyPassword()) {
        $result.text("Please enter in a password.");
        removeSpinner();
      }
      else {
        existingUser();
      }
    },
    bindSignin = function() {
      var $signInBtn = $('#signInBtn'),
          $passwordBox = $('.password', '#header-signin');

        $signInBtn.on('click', function () {
          processLogin();
        });

        $passwordBox.on('keyup', function(e) {
          if (e.keyCode == 13) {
            processLogin();
          }
        });
    },
    activateBtn = function($btn) {
      $btn.removeClass('btn-outline-secondary');
      $btn.addClass('btn-primary');
      $btn.prop('disabled', false);
    },
    deactiveBtn = function($btn) {
      $btn.removeClass('btn-primary');
      $btn.addClass('btn-outline-secondary');
      $btn.prop('disabled', true);
    },
    putSpinner = function() {
      var $signInBtn = $('.signInBtn');
      deactiveBtn($signInBtn);
      $signInBtn.html('<i class="fa fa-spinner fa-spin fa-3x fa-fw"></i>');
    },
    removeSpinner = function() {
      var $signInBtn = $('.signInBtn');
      activateBtn($signInBtn);
      $signInBtn.html('Sign In');
    },
    // email validation (email format)
    structureEmail = function (email) {
      var emailFormat = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return emailFormat.test(email);
    },
    // validating email to make sure that email is a valid email address
    validate = function () {
      $('#signInResult').text('');
      var email = $('.email').val();
      if (structureEmail(email)) {
        return true;
      } else {
        $('#signInResult').text(email + " is not valid");
        $('#signInResult').css('color', 'red');
        return false;
      }
    },
    // checks to make sure the user enters in a password into the input line
    emptyPassword = function () {
      var pw = $('.password').val();
      if (pw === "") {
        return true;
      }
      else {
        return false;
      }
    },
    closeModal = function($modal, callback) {
      $modal.modal('hide');

      $modal.off('hidden.bs.modal').on('hidden.bs.modal', function() {
        if (typeof callback === 'function') {
          callback();
        }
      });
    },
    bindLogOut = function() {
      var $logoutBtn = $('.logoutBtn', '.site-header');

      $logoutBtn.on('click', function(e) {
        e.preventDefault();
        $.ajax({
          method: 'post',
          url: '/profile/signout'
        })
        .done(function(res) {          
          WIU.animate.leavePage('/');
        })
        .fail(function(res, status, xhr) {
          console.log('An error occured', res);
        });
      });
    },
    bindHoverAnimation = function() {
      var $headerBtns = $('.header-btn');

      $headerBtns.hover(function() {
        WIU.animate.apply($(this), 'tada');
      }, 
      function() {

      });
    },
    // putting the existing user into an object
    existingUser = function () {
      var user = {
        email: $('.email').val(),
        password: $('.password').val()
      };
      $.ajax({
        method: 'post',
        url: '/profile/signin',
        data: user
      })
      .done(function(res) {
        removeSpinner();
        closeModal($('#header-signin'), function() {
          WIU.animate.leavePage(window.location.href);
        });
      })
      .fail(function(res, status, xhr) {
        var $result = $('#signInResult');

        if (res.status === 404) {
          $result.html('Incorrect email and/or password');
        }
        else {
          $result.html('An error occured. Please try again later.');
        }
        removeSpinner();
      });
    };

  return {
    init: init
  }
})();

$(function () {
  WIU.header.init();
});

var WIU = WIU || {};

WIU.landing = (function() {

  var 
  initFindBtn = function() {
    var $findBtn = $('.find-btn');
    $findBtn.on('click', function() {
      WIU.animate.leavePage('/find-events');
    });
  },
  initCreateBtn = function() {
    var $findBtn = $('.create-btn');

    $findBtn.on('click', function() {

      if ($findBtn.hasClass('need-signin')) {
        $('.sign-in', '.site-header').click();
        return false;
      }
      else {
        WIU.animate.leavePage('/create-event');  
      }
    });
  },
  startAnimate = function() {
    // animate title
    WIU.animate.bounceWords($('.main-title'), 400, function() {
      WIU.animate.apply($('.site-logo'), 'rubberBand', function() {
        WIU.animate.apply($('.slogan.fun-font'), 'tada'); 
      });
    });
    WIU.animate.slideIn($('.btn'));
  },
  init = function() {
    if ($('.landing-page').length) {
      startAnimate();
      initFindBtn();
      initCreateBtn();
    }
  };

  return {
    init : init
  }
})();

$(function() {
  WIU.landing.init();
});
var WIU = WIU || {};

WIU.profile = (function() {

  var 
  bindAvatarSelect = function() { 
    var $avatarBtn = $('.avatar', '.avatar-section');
        
    $avatarBtn.on('click', function() {
      var $currAvatar = $('.current-avatar'),
          currentAID = $currAvatar.attr('data-id'),
          avatarID = $(this).attr('data-id'); 

      if (currentAID !== avatarID) {
        $currAvatar.attr('data-id', avatarID);
        $currAvatar.addClass('avatar-' + avatarID);
        $currAvatar.removeClass('avatar-' + currentAID);

        WIU.animate.apply($currAvatar, 'rubberBand'); 
      }
    });
  },
  hasNewPassword = function(data) {
    return !(typeof data.newPW === 'undefined' ||
              data.newPW === null ||
              data.newPW.trim() === '');
  },
  confirmPassword = function(oldPW, newPW) {
    if (typeof oldPW === 'undefined' || 
        oldPW === null ||
        oldPW.trim() === '' ||
        typeof newPW === 'undefined' ||
        newPW === null ||
        newPW.trim() === '') return false;
    return (oldPW === newPW);
  },
  hasOldPassword = function(data) {
    if (typeof data.oldPW === 'undefined' ||
        data.oldPW === null ||
        data.oldPW.trim() === '') return false;
        return true;
  },
  verifyData = function(data) {
    // hide all existing error messages
    $('.error').addClass('hidden');

    // if user is trying to update his/her pw
    if (hasOldPassword(data)) {
      if (!hasNewPassword(data)) {
        $('.error-new-pw').removeClass('hidden');
        return false;
      }
      else if (!confirmPassword(data.newPW, data.confirmPW)) {
        $('.error-confirm').removeClass('hidden');
        return false;
      }
    }

    // if (!hasOldPassword(data)) {
    //   $('.error-old-pw').removeClass('hidden'); 
    //   return false;
    // }

    return true;
  },
  getUserData = function() {
    var editDiv = '.edit-profile',
        username = $('.username', editDiv).val(),
        oldPW = $('.old-pw', editDiv).val(),
        newPW = $('.new-pw', editDiv).val(),
        confirmPW = $('.confirm-pw', editDiv).val();

    return {
      userId: parseInt(window.location.href.match(/\d*$/)[0]),
      username  : username,
      avatar: $('.avatar').attr('data-id'),
      oldPW     : oldPW,
      newPW     : newPW,
      confirmPW : confirmPW
    };
  },
  modifyData = function(data) {
    if (!hasOldPassword(data) || !hasNewPassword(data)) {
      //console.log('no need for pw data');
      return {
        userId : data.userId,
        username : data.username,
        avatar : data.avatar
      }
    }
    else {
      //console.log('need pw data');
      return data;
    }
  },
  bindUpdateBtn = function() {
    var $updateBtn = $('.update-btn');

    $updateBtn.on('click', function() {
      var data = getUserData();

      if (verifyData(data)) {
        data = modifyData(data);
        
        $.ajax({
          method: 'PUT',
          url: '/profile/updateuser',
          data: data
        }).done(function(res) {
          WIU.animate.leavePage(window.location.href);
        });
      }
      else {
        console.log('problem with your input!')
      }
    });
  },
  bindDeleteBtn = function() {
    $('.delete-btn').on('click', function(e) {
      $.ajax({
        method: 'DELETE',
        url: '/profile/delete/' + window.location.href.match(/\d*$/)[0]
      }).done(function(res) {
        WIU.animate.leavePage('/');
      });
    });
  },
  isEventTab = function(classes) {
    return classes.indexOf('tab-events') !== -1;
  },
  isHostTab = function(classes) {
    return classes.indexOf('tab-yours') !== -1;
  },
  bindTabShown = function() {
    var $navTabs = $('#profile-tabs');

    $navTabs.on('shown.bs.tab', function(e) {
      
      if (isEventTab(e.target.className)) {
        WIU.animate.slideIn($('.invite-row', '.event-section'));
      }
      else if (isHostTab(e.target.className)) {
        WIU.animate.slideIn($('.host-row', '.yours-section')); 
      }
    });
  },
  bindDeleteProfile = function() {
    var $delBtn = $('.delete-btn', '.control');

    $delBtn.on('click', function() {
      // popup modal to warning them
      // call api to delete
      // on success, redirect them back to the landing page
    });
  },
  setInviteStatus = function ($inviteDiv, status) {
    if (status == 'G') {
      $inviteDiv.find('.fa-exclamation').removeClass('active');
      $inviteDiv.find('.fa-times').removeClass('active');
      $inviteDiv.find('.fa-check').addClass('active');
    }
    else if (status == 'D') {
      $inviteDiv.find('.fa-exclamation').removeClass('active');
      $inviteDiv.find('.fa-times').addClass('active');
      $inviteDiv.find('.fa-check').removeClass('active');
    }
  },
  updateInvite = function(obj) {
    $.ajax({
      method: 'PUT',
      url: '/event/updatestatus',
      data: {
        status: obj.status,
        eventId: obj.eventId,
        userId: obj.userId,
      }
    }).done(function(res) {
      console.log('update successful');
      
      setInviteStatus($('.invite-row.event-' + obj.eventId, '#events'), obj.status);
    });
  },
  bindGoBtn = function() {
    var $goBtn = $('.goBtn');

    $goBtn.on('click', function(e) {
      e.preventDefault();
      var eventId = $(this).attr('data-id'),
          dataObj = {
            status  : 'G',
            eventId : parseInt(eventId),
            userId  : parseInt(window.location.href.match(/\d*$/)[0])
          };

      updateInvite(dataObj);
    });
  },
  bindDeclineBtn = function() {
    var $declineBtn = $('.declineBtn');

    $declineBtn.on('click', function(e) {
      e.preventDefault();
      var eventId = $(this).attr('data-id'),
          dataObj = {
            status  : 'D',
            eventId : parseInt(eventId),
            userId  : parseInt(window.location.href.match(/\d*$/)[0])
          };

      updateInvite(dataObj);
    });
  },
  bindAddEvent = function() {
    var $addEventBtn = $('.create-btn', '.yours-section');

    $addEventBtn.on('click', function() {
      WIU.animate.leavePage('/create-event'); 
    });
  },
  bindFindEvent = function() {
    var $addEventBtn = $('.find-btn', '.event-section');

    $addEventBtn.on('click', function() {
      WIU.animate.leavePage('/find-events');
    });
  },
  init = function() {
    if ($('.profile-page').length) {
      bindDeleteProfile();
      bindTabShown();
      bindAddEvent();
      bindFindEvent();
      bindAvatarSelect();
      bindUpdateBtn();
      bindDeleteBtn();
      bindGoBtn();
      bindDeclineBtn();
    }
  };

  return {
    init : init
  }
})();

$(function() {
  WIU.profile.init();
});
var WIU = WIU || {};

WIU.signup = (function () {

  var
    // working with all the functions
    init = function () {
      if ($('.signup-page').length) {
        $('#signUpBtn').on('click', function () {
          var allGood = true;
          if (!validateUsername()) {
            $('#usernameResult').text("Please enter a valid username.");
            allGood = false;
          }
          if (!validate()) {
            $('#emailResult').text("Sorry! This email is not a valid email address.");
            allGood = false;
          }
          if (emptyPassword()) {
            $('#pwResult').text("Please enter in a password.");
            allGood = false;
          }
          if (!confirmPW()) {
            $('#result').text("Passwords don't match. Please try again.");
            allGood = false;
          }
          if (allGood) {
            addUser();
          }
        });
      }
    },
    // username validation
    validateUsername = function () {
      $('#usernameResult').text('');
      var username = $('#username').val().trim();
      if (username === "") {
        return false;
      } else {
        return true;
      }
    },
    // email validation (email format)
    validateEmail = function (email) {
      var emailFormat = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return emailFormat.test(email);

    },
    // validating email to make sure that email is a valid email address
    validate = function () {
      $('#emailResult').text('');
      var email = $('#email').val();
      if (validateEmail(email)) {
        return true;
      } else {
        $('#emailResult').text(email + " is not valid");
        $('#emailResult').css('color', 'red');
        return false;
      }
    },
    // confirming both passwords entered are the same
    confirmPW = function () {
      $('#result').text('');
      var pw = $('#password').val();
      var pwConfirm = $('#confirm-pw').val();
      if (pw === pwConfirm) {
        return true;
      } else {
        return false
      }
    },
    // checks to make sure the user enters in a password into the input line
    emptyPassword = function () {
      $('#pwResult').text('');
      var pw = $('#password').val();
      if (pw === "") {
        return true;
      }
      else {
        return false;
      }
    },
    signInUser = function(userObj) {
      $.ajax({
        method: "POST",
        url: "./profile/signin",
        data: {
          email : userObj.email,
          password : userObj.password
        }
      })
      .done(function(res) {
        // window.location = './profile/getuser/' + res.id;
        WIU.animate.leavePage('./profile/getuser/' + res.id);
      });
    },
    // adding user information into the new user object
    addUser = function () {
      var newUser = {
        username: $('#username').val().trim(),
        email: $('#email').val().trim(),
        password: $('#password').val().trim(),
        avatar: Math.floor(Math.random() * 4)
      };
      $.ajax({
        method: 'POST',
        url: './profile/signup',
        data: newUser
      })
      .done(function(res, status, xhr) {
        signInUser(newUser);
      })
      .fail(function(res, status, xhr) {
        $('#result').text("An Error has occured. Please sign up with another email address.");
        console.log('An Error has occurred ', res, status, xhr);
      })
    };

  return {
    init: init
  }
})();

$(function () {
  WIU.signup.init();
});






var WIU = WIU || {};

// JS that run on ALL pages
WIU.site = (function () {

  var
    getRand = function(min, max) {
      return Math.floor(Math.random()*(max-min+1)+min);
    }, 
    putBackground = function($div) {
      var bkgClass = 'country-' + getRand(0, 12);
      $div.addClass(bkgClass);
    },
    startTitleAnimate = function() {
      WIU.animate.apply($('h2.fun-font'), 'tada'); 
    },
    playSiteLogoAnimate = function() {
      var effects = ['swing', 'bounce', 'flash', 'jello', 'rubberBand', 'pulse'],
          $siteLogo = $('.site-logo');

      if ($siteLogo.length) {
        WIU.animate.apply($siteLogo, effects[getRand(0, effects.length-1)]);
      }
    },
    init = function () {
      putBackground($('.top-region'));
      putBackground($('.bottom-region'));

      WIU.animate.bkgSlideIn($('.top-region'));
      WIU.animate.bkgSlideIn($('.bottom-region'));

      var animteSiteLogo = setInterval(playSiteLogoAnimate, 4500);
      
      startTitleAnimate();
    };

  return {
    init: init
  }
})();

$(function () {
  WIU.site.init();
});
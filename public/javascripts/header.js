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

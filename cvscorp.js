// ==UserScript==
// @name         CVS Username Autofill (MutationObserver)
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Autofills the username field on the CVS website login page using MutationObserver
// @author       You
// @match        https://www.cvs.com/account-login/benefits/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const email = 'email';

  // Function to fill the username field
  function autofillUsername() {
    const usernameField = document.querySelector('input[type="text"]');
    if (usernameField) {
      usernameField.value = email;
      usernameField.dispatchEvent(new Event('input', { bubbles: true }));
      usernameField.dispatchEvent(new Event('change', { bubbles: true }));
      usernameField.focus();
      usernameField.blur();
      //observer.disconnect();
    }
  }

  // Create a MutationObserver instance
  const observer = new MutationObserver(function (mutationsList, observer) {
    for (const mutation of mutationsList) {
      autofillUsername();
    }
  });

  // Start observing the document body (or a more specific container if known)
  const targetNode = document.body;
  const config = { childList: true, subtree: true };
  observer.observe(targetNode, config);

  // Initial check in case the element is already present on page load
  autofillUsername();
})();
// Copyright 2015 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Translation functions for Oppia.
 *
 * @author milagro.teruel@gmail.com (Milagro Teruel)
 */

// Translations of strings that are loaded in the front page. They are listed
// here to be loaded synchronously with the script to prevent a FOUC or
// Flash of Untranslated Content.
// See http://angular-translate.github.io/docs/#/guide/12_asynchronous-loading
oppia.constant('DEFAULT_TRANSLATIONS', {
  I18N_LIBRARY_PAGE_TITLE: 'Library',
  I18N_LIBRARY_LOADING: 'Loading',
  I18N_SIGNUP_PAGE_SUBTITLE: 'Registration',
  I18N_SIGNUP_PAGE_TITLE: 'Oppia',
  I18N_LIBRARY_SEARCH_PLACEHOLDER: 'What are you curious about?',
  I18N_LIBRARY_ALL_LANGUAGES: 'All Languages',
  I18N_LIBRARY_LANGUAGES_EN: 'English',
  I18N_LIBRARY_ALL_CATEGORIES: 'All Categories',
  I18N_TOPNAV_SIGN_IN: 'Sign in',
  I18N_SPLASH_PAGE_TITLE: 'Oppia: Teach, Learn, Explore',
  I18N_SIGNUP_REGISTRATION: 'Registration',
  I18N_SIGNUP_LOADING: 'Loading'
});

oppia.factory('I18nFileHashLoader', [
  '$http', '$q', 'UrlInterpolationService',
  function($http, $q, UrlInterpolationService) {
    /* Options object contains:
     *  prefix: added before key, defined by developer
     *  key: language key, determined internally by i18n library
     *  suffix: added after key, defined by developer
     */
    return function(options) {
      var fileUrl = [
        options.prefix,
        options.key,
        options.suffix
      ].join('');
      return $http.get(
        UrlInterpolationService.getTranslateJsonUrl(fileUrl)
      ).then(function(result) {
        return result.data;
      }, function () {
        return $q.reject(options.key);
      });
    };
  }
]);

oppia.controller('I18nFooter', [
  '$http', '$rootScope', '$scope', '$translate', '$timeout', '$cookies',
  function($http, $rootScope, $scope, $translate, $timeout, $cookies) {
    // Changes the language of the translations.
    var preferencesDataUrl = '/preferenceshandler/data';
    var siteLanguageUrl = '/save_site_language';
    $scope.supportedSiteLanguages = constants.SUPPORTED_SITE_LANGUAGES;
    if (GLOBALS.userIsLoggedIn && GLOBALS.preferredSiteLanguageCode) {
      $translate.use(GLOBALS.preferredSiteLanguageCode);
    }
    else{
      $translate.use('zh-hans');
    }

    // The $timeout seems to be necessary for the dropdown to show anything
    // at the outset, if the default language is not English.
    $timeout(function() {
      // $translate.use() returns undefined until the language file is fully
      // loaded, which causes a blank field in the dropdown, hence we use
      // $translate.proposedLanguage() as suggested in
      // http://stackoverflow.com/a/28903658
      $scope.currentLanguageCode = $translate.use() ||
        $translate.proposedLanguage();
    }, 50);

    $scope.changeLanguage = function() {
      $translate.use($scope.currentLanguageCode);
      if (GLOBALS.userIsLoggedIn) {
        $http.put(siteLanguageUrl, {
          site_language_code: $scope.currentLanguageCode
        });
      } else {
        // $translate.use() sets a cookie for the translation language, but does
        // so using the page's base URL as the cookie path. However, the base
        // URL is modified in pages like /library, thus causing the cookie path
        // to change; in such cases, the user's preferences are not picked up by
        // other pages. To avoid this, we manually set the cookie using the '/'
        // path each time a non-logged-in user changes their site language.
        $cookies.put(
          'NG_TRANSLATE_LANG_KEY',
          '"' + $scope.currentLanguageCode + '"', {path: '/'});
      }
    };
  }
]);

oppia.config([
  '$translateProvider', 'DEFAULT_TRANSLATIONS',
  function($translateProvider, DEFAULT_TRANSLATIONS) {
    var availableLanguageKeys = [];
    var availableLanguageKeysMap = {};
    constants.SUPPORTED_SITE_LANGUAGES.forEach(function(language) {
      availableLanguageKeys.push(language.id);
      availableLanguageKeysMap[language.id + '*'] = language.id;
    });
    availableLanguageKeysMap['*'] = 'en';

    $translateProvider
      .registerAvailableLanguageKeys(
        availableLanguageKeys, availableLanguageKeysMap)
      .useLoader('I18nFileHashLoader', {
        prefix: '/i18n/',
        suffix: '.json'
      })
      // The use of default translation improves the loading time when English
      // is selected
      .translations('en', DEFAULT_TRANSLATIONS)
      .fallbackLanguage('en')
      .determinePreferredLanguage()
      .useCookieStorage()
      // The messageformat interpolation method is necessary for pluralization.
      // Is optional and should be passed as argument to the translate call. See
      // https://angular-translate.github.io/docs/#/guide/14_pluralization
      .addInterpolation('$translateMessageFormatInterpolation')
      // The strategy 'sanitize' does not support utf-8 encoding.
      // https://github.com/angular-translate/angular-translate/issues/1131
      // The strategy 'escape' will brake strings with raw html, like hyperlinks
      .useSanitizeValueStrategy('sanitizeParameters')
      .forceAsyncReload(true);
  }
]);

// Service to dynamically construct translation ids for i18n.
oppia.factory('i18nIdService', function() {
  return {
    // Construct a translation id for library from name and a prefix.
    // Ex: 'categories', 'art' -> 'I18N_LIBRARY_CATEGORIES_ART'
    getLibraryId: function(prefix, name) {
      return (
        'I18N_LIBRARY_' + prefix.toUpperCase() + '_' +
        name.toUpperCase().split(' ').join('_'));
    }
  };
});

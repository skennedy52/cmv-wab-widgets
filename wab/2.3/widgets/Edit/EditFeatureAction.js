
// Copyright © 2014 - 2016 Esri. All Rights Reserved.
//
// Licensed under the Apache License Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
///////////////////////////////////////////////////////////////////////////

define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/_base/lang',
  'dojo/Deferred',
  'jimu/BaseFeatureAction',
  'jimu/portalUtils',
  'jimu/Role',
  'jimu/WidgetManager'
], function(declare, array, lang, Deferred, BaseFeatureAction, portalUtils, Role, WidgetManager){
  var clazz = declare(BaseFeatureAction, {
    map: null,
    iconClass: 'icon-edit',

    isFeatureSupported: function(featureSet, layerParam){
      /*jshint unused: false*/
      var resultDef = new Deferred();
      var userDef = new Deferred();
      var portal = portalUtils.getPortal(window.portalUrl);
      portal.getUser().then(lang.hitch(this, function(user) {
        userDef.resolve(user);
      }), lang.hitch(this, function() {
        userDef.resolve(null);
      }));

      userDef.then(lang.hitch(this, function(user) {
        var hasEditPrivilege = this._checkEditPrivilege(user);
        if(!hasEditPrivilege) {
          resultDef.resolve(false);
        }

        var layer = layerParam ||
          lang.getObject('_wabProperties.popupInfo.layerForActionWithEmptyFeatures', false, this.map.infoWindow);
        if(!layer) {
          return false;
        }
        var layerHasBeenConfiged = false;
        var editConfig = this.appConfig.getConfigElementById(this.widgetId).config;
        if(!editConfig.editor.layerInfos) {
          layerHasBeenConfiged = false;
        } else if(editConfig.editor.layerInfos.length === 0) {
          layerHasBeenConfiged = true;
        } else {
          array.forEach(editConfig.editor.layerInfos.concat(editConfig.editor.tableInfos || []),
          function(layerInfoParam) {
            if(layer.id === layerInfoParam.featureLayer.id) {
              layerHasBeenConfiged = true;
            }
          });
        }

        if(layerHasBeenConfiged &&
           layer.isEditable &&
           layer.isEditable()) {
          resultDef.resolve(true);
        } else {
          resultDef.resolve(false);
        }
      }));
      return resultDef;
    },

    onExecute: function(featureSet, layerParam){
      //jshint unused:false
      var layer = layerParam ||
        lang.getObject('_wabProperties.popupInfo.layerForActionWithEmptyFeatures', false, this.map.infoWindow);
      var def = new Deferred();
      WidgetManager.getInstance().triggerWidgetOpen(this.widgetId)
      .then(function(editWidget) {
        editWidget.beginEditingByFeatures(featureSet.features, layer);
      });
      return def.promise;
    },

    _checkEditPrivilege: function(user) {
      var hasEditPrivilege = true;
      if(user) {
        var userRole = new Role({
          id: (user.roleId) ? user.roleId : user.role,
          role: user.role
        });
        if(user.privileges) {
          userRole.setPrivileges(user.privileges);
        }

        hasEditPrivilege = userRole.canEditFeatures();
      }
      return hasEditPrivilege;
    }

  });
  return clazz;
});

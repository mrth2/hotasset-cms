'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async beforeUpdate(data) {
      // auto update likes count from total upvoters
      if (data.upvoters) {
        data.likes = data.upvoters.length;
      }
      // if there's no upvoters update, remove likes from update data when received ( this field will become read only )
      else if (typeof data.likes !== 'undefined') {
        delete data.likes
      }
    }
  }
};

'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#lifecycle-hooks)
 * to customize this model
 */

module.exports = {
  lifecycles: {
    async beforeCreate(data) {
      if (data.name) {
        data.slug = await strapi.plugins['content-manager'].services.uid.generateUIDField({
          contentTypeUID: 'application::tag.tag',
          field: 'slug',
          data
        });
      }
    }
  }
};

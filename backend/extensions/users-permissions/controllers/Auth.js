'use strict';

/**
 * Auth.js controller
 *
 * @description: A set of functions called "actions" for managing `Auth`.
 */

/* eslint-disable no-useless-escape */
const _ = require('lodash');
const { sanitizeEntity } = require('strapi-utils');

const emailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
const formatError = error => [
  { messages: [{ id: error.id, message: error.message, field: error.field }] },
];

module.exports = {

  async registerIfNonExistentUser(ctx) {
    const provider = 'local';
    const params = ctx.request.body;

    const store = await strapi.store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
    });

    if (!_.get(await store.get({ key: 'grant' }), 'email.enabled')) {
      return ctx.badRequest(null, 'This provider is disabled.');
    }

    params.identifier = params.identifier || ctx.request.body.email || ctx.request.body.username || null;

    // The identifier is required.
    if (!params.identifier) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.email.provide',
          message: 'Please provide your username or your e-mail.',
        })
      );
    }

    // The password is required.
    if (!params.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.provide',
          message: 'Please provide your password.',
        })
      );
    }

    const query = { provider };

    // Check if the provided identifier is an email or not.
    const isEmail = emailRegExp.test(params.identifier);

    // Set the identifier to the appropriate query field.
    if (isEmail) {
      query.email = params.identifier.toLowerCase();
    } else {
      query.username = params.identifier;
    }

    // Check if the user exists.
    const user = await strapi.query('user', 'users-permissions').findOne(query);

    if (!user) {
      /// we should create a new user
      const settings = await store.get({
        key: 'advanced',
      });

      if (!settings.allow_register) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.advanced.allow_register',
            message: 'Register action is currently disabled.',
          })
        );
      }

      // Throw an error if the password selected by the user
      // contains more than three times the symbol '$'.
      if (strapi.plugins['users-permissions'].services.user.isHashed(params.password)) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.password.format',
            message: 'Your password cannot contain more than three times the symbol `$`.',
          })
        );
      }

      const role = await strapi
        .query('role', 'users-permissions')
        .findOne({ type: settings.default_role }, []);

      if (!role) {
        return ctx.badRequest(
          null,
          formatError({
            id: 'Auth.form.error.role.notFound',
            message: 'Impossible to find the default role.',
          })
        );
      }

      params.role = role.id;
      params.password = await strapi.plugins['users-permissions'].services.user.hashPassword(params);
      params.provider = 'local';

      try {
        if (!settings.email_confirmation) {
          params.confirmed = true;
        }

        const user = await strapi.query('user', 'users-permissions').create(params);

        const sanitizedUser = sanitizeEntity(user, {
          model: strapi.query('user', 'users-permissions').model,
        });

        if (settings.email_confirmation) {
          try {
            await strapi.plugins['users-permissions'].services.user.sendConfirmationEmail(user);
          } catch (err) {
            return ctx.badRequest(null, err);
          }

          return ctx.send({ user: sanitizedUser });
        }

        const jwt = strapi.plugins['users-permissions'].services.jwt.issue(_.pick(user, ['id']));

        return ctx.send({
          jwt,
          user: sanitizedUser,
        });
      } catch (err) {
        const adminError = _.includes(err.message, 'username')
          ? {
            id: 'Auth.form.error.username.taken',
            message: 'Username already taken',
          }
          : { id: 'Auth.form.error.email.taken', message: 'Email already taken' };

        ctx.badRequest(null, formatError(adminError));
      }
    }

    if (
      _.get(await store.get({ key: 'advanced' }), 'email_confirmation') &&
      user.confirmed !== true
    ) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.confirmed',
          message: 'Your account email is not confirmed',
        })
      );
    }

    if (user.blocked === true) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.blocked',
          message: 'Your account has been blocked by an administrator',
        })
      );
    }

    // The user never authenticated with the `local` provider.
    if (!user.password) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.password.local',
          message:
            'This user never set a local password, please login with the provider used during account creation.',
        })
      );
    }

    const validPassword = await strapi.plugins[
      'users-permissions'
    ].services.user.validatePassword(params.password, user.password);

    if (!validPassword) {
      return ctx.badRequest(
        null,
        formatError({
          id: 'Auth.form.error.invalid',
          message: 'Identifier or password invalid.',
        })
      );
    } else {
      ctx.send({
        jwt: strapi.plugins['users-permissions'].services.jwt.issue({
          id: user.id,
        }),
        user: sanitizeEntity(user.toJSON ? user.toJSON() : user, {
          model: strapi.query('user', 'users-permissions').model,
        }),
      });
    }

  },
};

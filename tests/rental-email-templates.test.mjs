import assert from 'node:assert/strict'
import test from 'node:test'

import {
  rentalEmailTemplateDefaults,
  rentalEmailTemplateDefinitions,
} from '../server/services/shop/rentalEmailTemplates.ts'

const appointmentVariables = ['fulfillmentDate', 'fulfillmentTime', 'fulfillmentLocation']

test('rental templates expose pickup appointment variables to the email editor', () => {
  for (const definition of rentalEmailTemplateDefinitions) {
    for (const variable of appointmentVariables) {
      assert.ok(definition.variables.includes(variable), `${definition.action} misses ${variable}`)
    }
  }
})

test('operational rental emails remind customers of the pickup appointment', () => {
  const operationalActions = [
    'rental_request_created',
    'rental_payment_confirmed',
    'rental_confirmed',
    'rental_in_preparation',
    'rental_ready',
  ]

  for (const action of operationalActions) {
    for (const locale of ['fr', 'en']) {
      const body = rentalEmailTemplateDefaults[action][locale].body
      for (const variable of appointmentVariables) {
        assert.match(body, new RegExp(`{{${variable}}}`), `${action}/${locale} misses ${variable}`)
      }
      assert.match(body, /{{rentalEndDate}}/, `${action}/${locale} misses rentalEndDate`)
    }
  }
})

test('rental start email reminds customers of return time and address', () => {
  for (const locale of ['fr', 'en']) {
    const body = rentalEmailTemplateDefaults.rental_started[locale].body
    assert.match(body, /{{rentalEndDate}}/)
    assert.match(body, /{{fulfillmentLocation}}/)
  }
})

test('deposit settlement emails expose and use settlement amounts', () => {
  const actions = [
    'rental_deposit_released',
    'rental_deposit_partially_retained',
    'rental_deposit_retained',
  ]
  const variables = ['depositAmount', 'depositReleasedAmount', 'depositRetainedAmount', 'depositSettlementNote']

  for (const action of actions) {
    const definition = rentalEmailTemplateDefinitions.find(entry => entry.action === action)
    assert.ok(definition, `${action} definition is missing`)
    for (const variable of variables) {
      assert.ok(definition.variables.includes(variable), `${action} misses ${variable}`)
    }
    for (const locale of ['fr', 'en']) {
      assert.ok(rentalEmailTemplateDefaults[action][locale].subject)
      assert.match(rentalEmailTemplateDefaults[action][locale].body, /{{depositSettlementNote}}/)
    }
  }
})

test('late return emails expose fee and return tracking variables', () => {
  const actions = ['rental_late_fee_due', 'rental_late_fee_paid', 'rental_late_fee_waived']
  const variables = ['actualReturnAt', 'lateDuration', 'lateFeeTotal', 'lateFeeSubtotal', 'lateFeeVatAmount', 'lateFeeWaiverReason']

  for (const action of actions) {
    const definition = rentalEmailTemplateDefinitions.find(entry => entry.action === action)
    assert.ok(definition, `${action} definition is missing`)
    for (const variable of variables) {
      assert.ok(definition.variables.includes(variable), `${action} misses ${variable}`)
    }
    for (const locale of ['fr', 'en']) {
      assert.ok(rentalEmailTemplateDefaults[action][locale].subject)
      assert.match(rentalEmailTemplateDefaults[action][locale].body, /{{actualReturnAt}}/)
    }
  }
})

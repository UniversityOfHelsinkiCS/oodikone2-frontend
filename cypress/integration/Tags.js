/// <reference types="Cypress" />

const deleteTag = (name) => {
  cy.contains(name).siblings().find('button').contains('Delete').click()
  cy.contains('Are you sure you want to delete tag')
  cy.contains('Confirm').click()
  cy.contains(name).should('not.exist')
}

describe('Tag tests', () => {
  beforeEach(() => {
    cy.server({
      onAnyRequest: function (route, proxy) {
        if (Cypress.config().baseUrl.includes("http://nginx/")) {
          proxy.xhr.setRequestHeader('uid', 'admink')
          proxy.xhr.setRequestHeader('shib-session-id', 'mock-shibboleth')
          proxy.xhr.setRequestHeader('hygroupcn', 'grp-oodikone-users')
          proxy.xhr.setRequestHeader('edupersonaffiliation', 'asdasd')
        }
      }
    })
    cy.visit(Cypress.config().baseUrl)
    cy.reload()
    cy.contains("Study programme").click()
    cy.contains("Overview").click()
    cy.contains("Datatieteen maisteriohjelma").click()
    cy.get('.attached > :nth-child(6)').click()
  })

  it("Tagged population works", () => {
    const name = `tag-${new Date().getTime()}`
    cy.get(':nth-child(1) > .field > .ui > input').type(name)
    cy.get('.form-control').type('2016')
    cy.contains('Create new tag').click()
    cy.contains(name)
    cy.contains('2016')

    cy.contains('Add tags to students').click()
    cy.get('.form > .field > .dropdown').click().get('.ui > .search').type(name).click()

    cy.get('.form > .field > .dropdown').contains(name).click()

    cy.get('textarea').type('014022579\n011122249')
    cy.get('.positive').click()
    cy.contains(name).find('.level').click()

    cy.contains('Credit accumulation (for 2 students)')
    cy.get(':nth-child(5) > .dividing > :nth-child(1)').click()
    cy.contains('014022579')
    cy.contains('011122249')

    cy.go('back')
    deleteTag(name)
  })
})
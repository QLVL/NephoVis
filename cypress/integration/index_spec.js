describe('My First Test', () => {
    // it('Does not do much!', () => {
    //     expect(true).to.equal(true)
    // });

    // it('Visits the index', () => {
    //     cy.visit('/')
    // });

    // it('Go to page button', () => {
    //     cy.visit('/');
    //     cy.contains('Go to page').click();
    //     cy.wait(1000);
    //     cy.location().should((loc) => {
    //         expect(loc.pathname).to.eq('/pilotTypes.html')
    //     })
    // });

    // it('Cloud are loaded', () => {
    //     cy.visit('/pilotTypes.html');
    //     cy.contains('Church');
    //     cy.contains('Zwart');
    // });

    // it('Church show cloud in level 1', () => {
    //     cy.visit('/level1.html?type=church');
    //     cy.wait(1000);
    //     cy.contains('Level 1 (church)');
    //     cy.contains('#svgContainer').should('not.exist');
    // });

    // it('Church show cloud in level 2', () => {
    //     cy.visit('/level2.html?type=church');
    //     cy.wait(1000);
    //     cy.get('#modelSelect').click();
    // });

    it('Church show cloud in level 1 and click on all', () => {
        cy.visit('/level1.html?type=church');
        cy.wait(500);
        cy.contains('Select PART-OF-SPEECH');
        cy.get('#focrow').contains('all').click();
    });

    it('Church show cloud in level 1 and click on nav', () => {
        cy.visit('/level1.html?type=church');
        cy.wait(500);
        cy.get('#focrow').contains('nav').click();
    });

    it('Church show cloud in level 1 and click on bound', () => {
        cy.visit('/level1.html?type=church');
        cy.wait(500);
        cy.get('#focrow').contains('bound').click();
    });

    it('Church show cloud in level 1 and click on nobound', () => {
        cy.visit('/level1.html?type=church');
        cy.wait(500);
        cy.get('#focrow').contains('nobound').click();
    });

    it('Church show cloud in level 1 and click on noweight', () => {
        cy.visit('/level1.html?type=church');
        cy.wait(500);
        cy.get('#focrow').contains('noweight').click();
    });
    
    it('Church show cloud in level 1 and click on selection', () => {
        cy.visit('/level1.html?type=church');
        cy.wait(500);
        cy.get('#focrow').contains('selection').click();
    });

    it('Church show cloud in level 1 and click on weight', () => {
        cy.visit('/level1.html?type=church');
        cy.wait(500);
        cy.get('#focrow').contains('weight').click();
    });

    it('Church show cloud in level 1 and click on 10_10', () => {
        cy.visit('/level1.html?type=church');
        cy.wait(500);
        cy.get('#focrow').contains('10_10').click();
    });

    it('Church show cloud in level 1 and click on 5_5', () => {
        cy.visit('/level1.html?type=church');
        cy.wait(500);
        cy.get('#focrow').contains('5_5').click();
    });

    it('Zwart show cloud in level 1', () => {
        cy.visit('/level1.html?type=zwart');
        cy.wait(1000);
        cy.contains('Level 1 (zwart)');
        cy.contains('#svgContainer').should('not.exist');
    });
    

    it('Zwart show cloud in level 1 and click on all', () => {
        cy.visit('level1.html?type=zwart');
        cy.wait(500);
        cy.get('#focrow').contains('all').click();
    });

    it('Zwart show cloud in level 1 and click on nav', () => {
        cy.visit('level1.html?type=zwart');
        cy.wait(500);
        cy.get('#focrow').contains('nav').click();
    });

    it('Zwart show cloud in level 1 and click on bound', () => {
        cy.visit('level1.html?type=zwart');
        cy.wait(500);
        cy.get('#focrow').contains('bound').click();
    });

    it('Zwart show cloud in level 1 and click on nobound', () => {
        cy.visit('level1.html?type=zwart');
        cy.wait(500);
        cy.get('#focrow').contains('nobound').click();
    });

    it('Zwart show cloud in level 1 and click on noweight', () => {
        cy.visit('level1.html?type=zwart');
        cy.wait(500);
        cy.get('#focrow').contains('noweight').click();
    });
    
    it('Zwart show cloud in level 1 and click on selection', () => {
        cy.visit('level1.html?type=zwart');
        cy.wait(500);
        cy.get('#focrow').contains('selection').click();
    });

    it('Zwart show cloud in level 1 and click on weight', () => {
        cy.visit('level1.html?type=zwart');
        cy.wait(500);
        cy.get('#focrow').contains('weight').click();
    });

    it('Zwart show cloud in level 1 and click on 10_10', () => {
        cy.visit('level1.html?type=zwart');
        cy.wait(500);
        cy.get('#focrow').contains('10_10').click();
    });
    
    it('Zwart show cloud in level 1 and click on 5_5', () => {
        cy.visit('level1.html?type=zwart');
        cy.wait(500);
        cy.get('#focrow').contains('5_5').click();
    });
})
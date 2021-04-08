import { expect, html, defineCE, unsafeStatic, fixture } from '@open-wc/testing';
import { LitElement } from '@lion/core';
import sinon from 'sinon';
import { FormControlMixin } from '../src/FormControlMixin.js';
import { FormRegistrarMixin } from '../src/registration/FormRegistrarMixin.js';

describe('FormControlMixin', () => {
  const inputSlot = html`<input slot="input" />`;

  class FormControlMixinClass extends FormControlMixin(LitElement) {}

  const tagString = defineCE(FormControlMixinClass);
  const tag = unsafeStatic(tagString);

  it('is hidden when attribute hidden is true', async () => {
    const el = await fixture(html`
    <${tag} hidden>
    <label slot="label">Email <span>address</span></label>
        ${inputSlot}
    </${tag}>`);
    expect(el).not.to.be.displayed;
  });

  describe('Label and helpText api', () => {
    it('has a label', async () => {
      const elAttr = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag} label="Email address">${inputSlot}</${tag}>
      `));

      expect(elAttr.label).to.equal('Email address', 'as an attribute');

      const elProp = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag}
          .label=${'Email address'}
        >${inputSlot}
        </${tag}>`));
      expect(elProp.label).to.equal('Email address', 'as a property');

      const elElem = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag}>
          <label slot="label">Email address</label>
          ${inputSlot}
        </${tag}>`));
      expect(elElem.label).to.equal('Email address', 'as an element');
    });

    it('has a label that supports inner html', async () => {
      const el = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag}>
          <label slot="label">Email <span>address</span></label>
          ${inputSlot}
        </${tag}>`));
      expect(el.label).to.equal('Email address');
    });

    it('only takes label of direct child', async () => {
      const el = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag}>
          <${tag} label="Email address">
            ${inputSlot}
          </${tag}>
        </${tag}>`));
      expect(el.label).to.equal('');
    });

    it('can have a help-text', async () => {
      const elAttr = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag} help-text="We will not send you any spam">${inputSlot}</${tag}>
      `));
      expect(elAttr.helpText).to.equal('We will not send you any spam', 'as an attribute');

      const elProp = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag}
          .helpText=${'We will not send you any spam'}
        >${inputSlot}
        </${tag}>`));
      expect(elProp.helpText).to.equal('We will not send you any spam', 'as a property');

      const elElem = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag}>
          <div slot="help-text">We will not send you any spam</div>
          ${inputSlot}
        </${tag}>`));
      expect(elElem.helpText).to.equal('We will not send you any spam', 'as an element');
    });

    it('can have a help-text that supports inner html', async () => {
      const el = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag}>
          <div slot="help-text">We will not send you any <span>spam</span></div>
          ${inputSlot}
        </${tag}>`));
      expect(el.helpText).to.equal('We will not send you any spam');
    });

    it('only takes help-text of direct child', async () => {
      const el = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag}>
          <${tag} help-text="We will not send you any spam">
            ${inputSlot}
          </${tag}>
        </${tag}>`));
      expect(el.helpText).to.equal('');
    });
  });

  describe('Accessibility', () => {
    it('does not duplicate aria-describedby and aria-labelledby ids on reconnect', async () => {
      const wrapper = /** @type {HTMLElement} */ (await fixture(html`
        <div id="wrapper">
          <${tag} help-text="This element will be disconnected/reconnected">${inputSlot}</${tag}>
        </div>
      `));
      const el = /** @type {FormControlMixinClass} */ (wrapper.querySelector(tagString));
      const labelIdsBefore = /** @type {string} */ (el._inputNode.getAttribute('aria-labelledby'));
      const descriptionIdsBefore = /** @type {string} */ (el._inputNode.getAttribute(
        'aria-describedby',
      ));
      // Reconnect
      wrapper.removeChild(el);
      wrapper.appendChild(el);
      const labelIdsAfter = /** @type {string} */ (el._inputNode.getAttribute('aria-labelledby'));
      const descriptionIdsAfter = /** @type {string} */ (el._inputNode.getAttribute(
        'aria-describedby',
      ));

      expect(labelIdsBefore).to.equal(labelIdsAfter);
      expect(descriptionIdsBefore).to.equal(descriptionIdsAfter);
    });

    it('adds aria-live="polite" to the feedback slot', async () => {
      const el = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag}>
          ${inputSlot}
          <div slot="feedback">Added to see attributes</div>
        </${tag}>
      `));

      expect(
        Array.from(el.children)
          .find(child => child.slot === 'feedback')
          ?.getAttribute('aria-live'),
      ).to.equal('polite');
    });

    it('clicking the label should call `_onLabelClick`', async () => {
      const spy = sinon.spy();
      const el = /** @type {FormControlMixinClass} */ (await fixture(html`
        <${tag} ._onLabelClick="${spy}">
          ${inputSlot}
        </${tag}>
      `));
      expect(spy).to.not.have.been.called;
      el._labelNode.click();
      expect(spy).to.have.been.calledOnce;
    });

    describe('Adding extra labels and descriptions', () => {
      it(`supports centrally orchestrated labels/descriptions via addToAriaLabelledBy() /
      removeFromAriaLabelledBy() / addToAriaDescribedBy() / removeFromAriaDescribedBy()`, async () => {
        const wrapper = /** @type {HTMLElement} */ (await fixture(html`
          <div id="wrapper">
            <${tag}>
              ${inputSlot}
              <label slot="label">Added to label by default</label>
              <div slot="feedback">Added to description by default</div>
            </${tag}>
            <div id="additionalLabel"> This also needs to be read whenever the input has focus</div>
            <div id="additionalDescription"> Same for this </div>
          </div>`));
        const el = /** @type {FormControlMixinClass} */ (wrapper.querySelector(tagString));
        // wait until the field element is done rendering
        await el.updateComplete;
        await el.updateComplete;

        // 1a. addToAriaLabelledBy()
        // Check if the aria attr is filled initially
        expect(/** @type {string} */ (el._inputNode.getAttribute('aria-labelledby'))).to.contain(
          `label-${el._inputId}`,
        );
        const additionalLabel = /** @type {HTMLElement} */ (wrapper.querySelector(
          '#additionalLabel',
        ));
        el.addToAriaLabelledBy(additionalLabel);
        await el.updateComplete;
        let labelledbyAttr = /** @type {string} */ (el._inputNode.getAttribute('aria-labelledby'));
        // Now check if ids are added to the end (not overridden)
        expect(labelledbyAttr).to.contain(`additionalLabel`);
        // Should be placed in the end
        expect(
          labelledbyAttr.indexOf(`label-${el._inputId}`) <
            labelledbyAttr.indexOf('additionalLabel'),
        );

        // 1b. removeFromAriaLabelledBy()
        el.removeFromAriaLabelledBy(additionalLabel);
        await el.updateComplete;
        labelledbyAttr = /** @type {string} */ (el._inputNode.getAttribute('aria-labelledby'));
        // Now check if ids are added to the end (not overridden)
        expect(labelledbyAttr).to.not.contain(`additionalLabel`);

        // 2a. addToAriaDescribedBy()
        // Check if the aria attr is filled initially
        expect(/** @type {string} */ (el._inputNode.getAttribute('aria-describedby'))).to.contain(
          `feedback-${el._inputId}`,
        );
        // const additionalDescription = /** @type {HTMLElement} */ (wrapper.querySelector(
        //   '#additionalDescription',
        // ));
        // el.addToAriaDescribedBy(additionalDescription);
        // await el.updateComplete;

        // let describedbyAttr = /** @type {string} */ (el._inputNode.getAttribute(
        //   'aria-describedby',
        // ));

        // // Now check if ids are added to the end (not overridden)
        // expect(describedbyAttr).to.contain(`feedback-${el._inputId}`);
        // // Should be placed in the end
        // expect(
        //   describedbyAttr.indexOf(`feedback-${el._inputId}`) <
        //     describedbyAttr.indexOf('additionalDescription'),
        // );

        // // 2b. removeFromAriaDescription()
        // el.removeFromAriaDescribedBy(additionalDescription);
        // await el.updateComplete;

        // describedbyAttr = /** @type {string} */ (el._inputNode.getAttribute('aria-describedby'));
        // // Now check if ids are added to the end (not overridden)
        // expect(describedbyAttr).to.not.contain(`additionalDescription`);
      });

      it('sorts internal elements, and allows opt-out', async () => {
        const wrapper = await fixture(html`
        <div id="wrapper">
          <${tag}>
            <input slot="input" id="myInput" />
            <label slot="label" id="internalLabel">Added to label by default</label>
            <div slot="help-text" id="internalDescription">
              Added to description by default
            </div>
          </${tag}>
          <div id="externalLabelB">should go after input internals</div>
          <div id="externalDescriptionB">should go after input internals</div>
        </div>`);
        const el = /** @type {FormControlMixinClass} */ (wrapper.querySelector(tagString));

        // N.B. in real life we would never add the input to aria-describedby or -labelledby,
        // but this example purely demonstrates dom order is respected.
        // A real life scenario would be for instance when
        // a Field or FormGroup would be extended and an extra slot would be added in the template
        const myInput = /** @type {HTMLElement} */ (wrapper.querySelector('#myInput'));
        el.addToAriaLabelledBy(myInput);
        await el.updateComplete;
        el.addToAriaDescribedBy(myInput);
        await el.updateComplete;

        expect(
          /** @type {string} */ (el._inputNode.getAttribute('aria-labelledby')).split(' '),
        ).to.eql(['myInput', 'internalLabel']);
        expect(
          /** @type {string} */ (el._inputNode.getAttribute('aria-describedby')).split(' '),
        ).to.eql(['myInput', 'internalDescription']);

        // cleanup
        el.removeFromAriaLabelledBy(myInput);
        await el.updateComplete;
        el.removeFromAriaDescribedBy(myInput);
        await el.updateComplete;

        // opt-out of reorder
        el.addToAriaLabelledBy(myInput, { reorder: false });
        await el.updateComplete;
        el.addToAriaDescribedBy(myInput, { reorder: false });
        await el.updateComplete;

        expect(
          /** @type {string} */ (el._inputNode.getAttribute('aria-labelledby')).split(' '),
        ).to.eql(['internalLabel', 'myInput']);
        expect(
          /** @type {string} */ (el._inputNode.getAttribute('aria-describedby')).split(' '),
        ).to.eql(['internalDescription', 'myInput']);
      });

      it('respects provided order for external elements', async () => {
        const wrapper = await fixture(html`
        <div id="wrapper">
          <div id="externalLabelA">should go after input internals</div>
          <div id="externalDescriptionA">should go after input internals</div>
          <${tag}>
            <input slot="input" />
            <label slot="label" id="internalLabel">Added to label by default</label>
            <div slot="help-text" id="internalDescription">Added to description by default</div>
          </${tag}>
          <div id="externalLabelB">should go after input internals</div>
          <div id="externalDescriptionB">should go after input internals</div>
        </div>`);
        const el = /** @type {FormControlMixinClass} */ (wrapper.querySelector(tagString));

        // 1. addToAriaLabelledBy()
        const labelA = /** @type {HTMLElement} */ (wrapper.querySelector('#externalLabelA'));
        const labelB = /** @type {HTMLElement} */ (wrapper.querySelector('#externalLabelB'));
        // external inputs should go in order defined by user
        el.addToAriaLabelledBy(labelA);
        el.addToAriaLabelledBy(labelB);
        await el.updateComplete;

        expect(
          /** @type {string} */ (el._inputNode.getAttribute('aria-labelledby')).split(' '),
        ).to.eql(['internalLabel', 'externalLabelA', 'externalLabelB']);

        // 2. addToAriaDescribedBy()
        const descrA = /** @type {HTMLElement} */ (wrapper.querySelector('#externalDescriptionA'));
        const descrB = /** @type {HTMLElement} */ (wrapper.querySelector('#externalDescriptionB'));

        el.addToAriaDescribedBy(descrA);
        el.addToAriaDescribedBy(descrB);
        await el.updateComplete;

        expect(
          /** @type {string} */ (el._inputNode.getAttribute('aria-describedby')).split(' '),
        ).to.eql(['internalDescription', 'externalDescriptionA', 'externalDescriptionB']);
      });
    });
  });

  describe('Model-value-changed event propagation', () => {
    const FormControlWithRegistrarMixinClass = class extends FormControlMixin(
      FormRegistrarMixin(LitElement),
    ) {};

    const groupElem = defineCE(FormControlWithRegistrarMixinClass);
    const groupTag = unsafeStatic(groupElem);

    describe('On initialization', () => {
      it('redispatches one event from host', async () => {
        const formSpy = sinon.spy();
        const fieldsetSpy = sinon.spy();
        const formEl = /** @type {FormControlMixinClass} */ (await fixture(html`
          <${groupTag} name="form" ._repropagationRole=${'form-group'} @model-value-changed=${formSpy}>
            <${groupTag} name="fieldset" ._repropagationRole=${'form-group'} @model-value-changed=${fieldsetSpy}>
              <${tag} name="field"></${tag}>
            </${groupTag}>
          </${groupTag}>
        `));
        const fieldsetEl = formEl.querySelector('[name=fieldset]');

        expect(fieldsetSpy.callCount).to.equal(1);
        const fieldsetEv = fieldsetSpy.firstCall.args[0];
        expect(fieldsetEv.target).to.equal(fieldsetEl);
        expect(fieldsetEv.detail.formPath).to.eql([fieldsetEl]);
        expect(fieldsetEv.detail.initialize).to.be.true;

        expect(formSpy.callCount).to.equal(1);
        const formEv = formSpy.firstCall.args[0];
        expect(formEv.target).to.equal(formEl);
        expect(formEv.detail.formPath).to.eql([formEl]);
        expect(formEv.detail.initialize).to.be.true;
      });
    });

    /**
     * After initialization means: events triggered programmatically or by user actions
     */
    describe('After initialization', () => {
      it('redispatches one event from host and keeps formPath history', async () => {
        const formSpy = sinon.spy();
        const fieldsetSpy = sinon.spy();
        const fieldSpy = sinon.spy();
        const formEl = await fixture(html`
          <${groupTag} name="form">
            <${groupTag} name="fieldset">
              <${tag} name="field"></${tag}>
            </${groupTag}>
          </${groupTag}>
        `);
        const fieldEl = formEl.querySelector('[name=field]');
        const fieldsetEl = formEl.querySelector('[name=fieldset]');

        formEl.addEventListener('model-value-changed', formSpy);
        fieldsetEl?.addEventListener('model-value-changed', fieldsetSpy);
        fieldEl?.addEventListener('model-value-changed', fieldSpy);

        fieldEl?.dispatchEvent(new Event('model-value-changed', { bubbles: true }));

        expect(fieldsetSpy.callCount).to.equal(1);
        const fieldsetEv = fieldsetSpy.firstCall.args[0];
        expect(fieldsetEv.target).to.equal(fieldsetEl);
        expect(fieldsetEv.detail.formPath).to.eql([fieldEl, fieldsetEl]);

        expect(formSpy.callCount).to.equal(1);
        const formEv = formSpy.firstCall.args[0];
        expect(formEv.target).to.equal(formEl);
        expect(formEv.detail.formPath).to.eql([fieldEl, fieldsetEl, formEl]);
      });

      it('sends one event for single select choice-groups', async () => {
        const formSpy = sinon.spy();
        const choiceGroupSpy = sinon.spy();
        const formEl = await fixture(html`
          <${groupTag} name="form">
            <${groupTag} name="choice-group" ._repropagationRole=${'choice-group'}>
              <${tag} name="choice-group" id="option1" .checked=${true}></${tag}>
              <${tag} name="choice-group" id="option2"></${tag}>
            </${groupTag}>
          </${groupTag}>
        `);
        const choiceGroupEl = formEl.querySelector('[name=choice-group]');
        /** @typedef {{ checked: boolean }} checkedInterface */
        const option1El = /** @type {HTMLElement & checkedInterface} */ (formEl.querySelector(
          '#option1',
        ));
        const option2El = /** @type {HTMLElement & checkedInterface} */ (formEl.querySelector(
          '#option2',
        ));
        formEl.addEventListener('model-value-changed', formSpy);
        choiceGroupEl?.addEventListener('model-value-changed', choiceGroupSpy);

        // Simulate check
        option2El.checked = true;
        option2El.dispatchEvent(new Event('model-value-changed', { bubbles: true }));
        option1El.checked = false;
        option1El.dispatchEvent(new Event('model-value-changed', { bubbles: true }));

        expect(choiceGroupSpy.callCount).to.equal(1);
        const choiceGroupEv = choiceGroupSpy.firstCall.args[0];
        expect(choiceGroupEv.target).to.equal(choiceGroupEl);
        expect(choiceGroupEv.detail.formPath).to.eql([choiceGroupEl]);
        expect(choiceGroupEv.detail.isTriggeredByUser).to.be.false;

        expect(formSpy.callCount).to.equal(1);
        const formEv = formSpy.firstCall.args[0];
        expect(formEv.target).to.equal(formEl);
        expect(formEv.detail.formPath).to.eql([choiceGroupEl, formEl]);
        expect(formEv.detail.isTriggeredByUser).to.be.false;
      });

      it('sets "isTriggeredByUser" event detail when event triggered by user', async () => {
        const formSpy = sinon.spy();
        const fieldsetSpy = sinon.spy();
        const fieldSpy = sinon.spy();
        const formEl = await fixture(html`
          <${groupTag} name="form">
            <${groupTag} name="fieldset">
              <${tag} name="field"></${tag}>
            </${groupTag}>
          </${groupTag}>
        `);
        const fieldEl = formEl.querySelector('[name=field]');
        const fieldsetEl = formEl.querySelector('[name=fieldset]');

        formEl.addEventListener('model-value-changed', formSpy);
        fieldsetEl?.addEventListener('model-value-changed', fieldsetSpy);
        fieldEl?.addEventListener('model-value-changed', fieldSpy);

        fieldEl?.dispatchEvent(
          new CustomEvent('model-value-changed', {
            bubbles: true,
            detail: { isTriggeredByUser: true },
          }),
        );

        const fieldsetEv = fieldsetSpy.firstCall.args[0];
        expect(fieldsetEv.detail.isTriggeredByUser).to.be.true;

        const formEv = formSpy.firstCall.args[0];
        expect(formEv.detail.isTriggeredByUser).to.be.true;
      });
    });
  });
});

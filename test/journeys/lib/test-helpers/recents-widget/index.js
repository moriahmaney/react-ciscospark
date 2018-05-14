import {assert} from 'chai';

import waitForPromise from '../../wait-for-promise';

export const elements = {
  recentsWidget: '.ciscospark-spaces-list-wrapper',
  firstSpace: '.space-item:first-child',
  title: '.space-title',
  unreadIndicator: '.space-unread-indicator',
  lastActivity: '.space-last-activity',
  callButton: 'button[aria-label="Call Space"]',
  joinCallButton: 'button[aria-label="Join Call"]',
  answerButton: 'button[aria-label="Answer"]'
};

/**
 * Sends a message to a space and verifies that it is received and displayed
 *
 * @export
 * @param {object} aBrowser
 * @param {object} sender - Person with spark object
 * @param {object} conversation
 * @param {string} message
 * @param {boolean} [isOneOnOne=false]
 * @returns {undefined}
 */
export function displayIncomingMessage(aBrowser, sender, conversation, message, isOneOnOne = false) {
  const spaceTitle = isOneOnOne ? sender.displayName : conversation.displayName;
  waitForPromise(sender.spark.internal.conversation.post(conversation, {
    displayName: message
  }));
  aBrowser.waitUntil(() => aBrowser.element(`${elements.firstSpace} ${elements.title}`).getText() === spaceTitle);
  aBrowser.waitUntil(() => aBrowser.element(`${elements.firstSpace} ${elements.lastActivity}`).getText().includes(message));
  assert.isTrue(aBrowser.element(`${elements.firstSpace} ${elements.unreadIndicator}`).isVisible(), 'does not have unread indicator');
}

/**
 * Sends a message to a space and verifies that it is received and displayed,
 * then marks it read.
 *
 * @export
 * @param {object} aBrowser
 * @param {object} sender - Person with spark object
 * @param {object} receiver - Person with spark object
 * @param {object} conversation
 * @param {string} message
 * @returns {undefined}
 */
export function displayAndReadIncomingMessage(aBrowser, sender, receiver, conversation, message) {
  let activity;
  waitForPromise(sender.spark.internal.conversation.post(conversation, {
    displayName: message
  }).then((a) => {
    activity = a;
  }));
  aBrowser.waitUntil(() => aBrowser.element(`${elements.firstSpace} ${elements.lastActivity}`).getText().includes(message));
  assert.isTrue(aBrowser.element(`${elements.firstSpace} ${elements.unreadIndicator}`).isVisible(), 'does not have unread indicator');
  // Acknowledge the activity to mark it read
  waitForPromise(receiver.spark.internal.conversation.acknowledge(conversation, activity));
  // aBrowser.waitUntil(() => !aBrowser.element(`${elements.firstSpace} ${elements.unreadIndicator}`).isVisible());
}

/**
 * Creates a new space and posts a message to it, then verifies
 * space is displayed properly
 *
 * @export
 * @param {object} aBrowser
 * @param {object} sender
 * @param {array} participants
 * @param {string} roomTitle
 * @param {string} firstPost
 * @param {boolean} [isOneOnOne=false]
 * @returns {undefined}
 */
export function createSpaceAndPost(aBrowser, sender, participants, roomTitle, firstPost, isOneOnOne = false) {
  const spaceTitle = isOneOnOne ? sender.displayName : roomTitle;
  let conversation;
  const createOptions = {
    participants
  };
  if (roomTitle) {
    createOptions.displayName = roomTitle;
  }
  waitForPromise(sender.spark.internal.conversation.create(createOptions)
    .then((c) => {
      conversation = c;
      return sender.spark.internal.conversation.post(c, {
        displayName: firstPost
      });
    }));
  aBrowser.waitUntil(() => aBrowser.element(`${elements.firstSpace} ${elements.title}`).getText().includes(spaceTitle));
  aBrowser.waitUntil(() => aBrowser.element(`${elements.firstSpace} ${elements.lastActivity}`).getText().includes(firstPost));
  return conversation;
}

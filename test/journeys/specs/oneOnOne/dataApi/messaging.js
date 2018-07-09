import {assert} from 'chai';

import testUsers from '@ciscospark/test-helper-test-users';

import '@ciscospark/internal-plugin-conversation';
import {updateJobStatus} from '../../../lib/test-helpers';
import {
  canDeleteMessage,
  deleteMessage,
  flagMessage,
  messageTests,
  removeFlagMessage,
  sendMessage,
  verifyMessageReceipt
} from '../../../lib/test-helpers/space-widget/messaging';

describe('Widget Space: One on One: Data API', () => {
  const browserLocal = browser.select('browserLocal');
  const browserRemote = browser.select('browserRemote');
  const jobName = 'react-widget-oneOnOne-dataApi';
  let allPassed = true;
  let local, mccoy, remote, spock;

  before('load browsers', () => {
    browser.url('/data-api/space.html');
  });

  before('create spock', () => testUsers.create({count: 1, config: {displayName: 'Mr Spock'}})
    .then((users) => {
      [spock] = users;
      local = {browser: browserLocal, user: spock, displayName: spock.displayName};
    }));

  before('create mccoy', () => testUsers.create({count: 1, config: {displayName: 'Bones Mccoy'}})
    .then((users) => {
      [mccoy] = users;
      remote = {browser: browserRemote, user: mccoy, displayName: mccoy.displayName};
    }));

  before('pause to let test users establish', () => browser.pause(5000));

  before('inject token', () => {
    local.browser.execute((localAccessToken, localToUserEmail) => {
      const csmmDom = document.createElement('div');
      csmmDom.setAttribute('class', 'ciscospark-widget');
      csmmDom.setAttribute('data-toggle', 'ciscospark-space');
      csmmDom.setAttribute('data-access-token', localAccessToken);
      csmmDom.setAttribute('data-destination-id', localToUserEmail);
      csmmDom.setAttribute('data-destination-type', 'email');
      csmmDom.setAttribute('data-initial-activity', 'message');
      document.getElementById('ciscospark-widget').appendChild(csmmDom);
      window.loadBundle('/dist-space/bundle.js');
    }, spock.token.access_token, mccoy.email);
    local.browser.waitForVisible(`[placeholder="Send a message to ${mccoy.displayName}"]`);
  });

  describe('message widget', () => {
    before('open remote widget', () => {
      remote.browser.execute((localAccessToken, localToUserEmail) => {
        const csmmDom = document.createElement('div');
        csmmDom.setAttribute('class', 'ciscospark-widget');
        csmmDom.setAttribute('data-toggle', 'ciscospark-space');
        csmmDom.setAttribute('data-access-token', localAccessToken);
        csmmDom.setAttribute('data-destination-id', localToUserEmail);
        csmmDom.setAttribute('data-destination-type', 'email');
        csmmDom.setAttribute('data-initial-activity', 'message');
        csmmDom.setAttribute('on-event', 'message');
        document.getElementById('ciscospark-widget').appendChild(csmmDom);
        window.loadBundle('/dist-space/bundle.js');
      }, mccoy.token.access_token, spock.email);
      remote.browser.waitForVisible(`[placeholder="Send a message to ${spock.displayName}"]`);
    });

    it('sends and receives messages', () => {
      const message = 'Oh, I am sorry, Doctor. Were we having a good time?';
      sendMessage(local, remote, message);
      verifyMessageReceipt(remote, local, message);
    });

    describe('message actions', () => {
      describe('message flags', () => {
        const message = 'Do you really think this is a good idea?';
        before('create a message to flag', () => {
          sendMessage(remote, local, message);
          verifyMessageReceipt(local, remote, message);
        });

        it('should be able to flag a message', () => {
          flagMessage(local, message);
        });

        it('should be able to unflag a message', () => {
          removeFlagMessage(local, message);
        });
      });

      describe('delete message', () => {
        it('should be able to delete a message from self', () => {
          const message = 'There is no spoon!';
          sendMessage(local, remote, message);
          verifyMessageReceipt(remote, local, message);
          deleteMessage(local, message);
        });

        it('should not be able to delete a message from others', () => {
          const message = 'Hey you guys!';
          sendMessage(remote, local, message);
          verifyMessageReceipt(local, remote, message);
          assert.isFalse(canDeleteMessage(local, message));
        });
      });
    });

    describe('File Transfer Tests', () => {
      it('sends message with png attachment', () => {
        messageTests.sendFileTest(local, remote, 'png-sample.png');
      });

      it('verifies png-sample is in files tab', () => {
        messageTests.filesTabTest(local, remote, 'png-sample.png');
      });
    });

    describe('markdown messaging', () => {
      it('sends message with bold text', () => {
        messageTests.markdown.bold(remote, local);
      });

      it('sends message with italic text', () => {
        messageTests.markdown.italic(local, remote);
      });

      it('sends message with a blockquote', () => {
        messageTests.markdown.blockquote(remote, local);
      });

      it('sends message with numbered list', () => {
        messageTests.markdown.orderedList(local, remote);
      });

      it('sends message with bulleted list', () => {
        messageTests.markdown.unorderedList(remote, local);
      });

      it('sends message with heading 1', () => {
        messageTests.markdown.heading1(local, remote);
      });

      it('sends message with heading 2', () => {
        messageTests.markdown.heading2(remote, local);
      });

      it('sends message with heading 3', () => {
        messageTests.markdown.heading3(local, remote);
      });

      it('sends message with horizontal line', () => {
        messageTests.markdown.hr(remote, local);
      });

      it('sends message with link', () => {
        messageTests.markdown.link(local, remote);
      });

      it('sends message with inline code', () => {
        messageTests.markdown.inline(remote, local);
      });

      it('sends message with codeblock', () => {
        messageTests.markdown.codeblock(local, remote);
      });
    });
  });

  /* eslint-disable-next-line func-names */
  afterEach(function () {
    allPassed = allPassed && (this.currentTest.state === 'passed');
  });

  after(() => {
    updateJobStatus(jobName, allPassed);
  });
});

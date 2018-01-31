var responses = [];
function addResponse(resp) {
    responses.push(resp);
}
function matchResponses(expected) {
    var haderrors = false;
    for(var i=0;i<expected.length;i++) {
	if (typeof responses[i]==='undefined') {
	    console.error('mismatch at #'+i+', expected: ',expected[i],', got no counterpart');
	    haderrors = true;
	}
	else if (responses[i]!==expected[i]) {
	    console.error('mismatch at #'+i+', expected: ',expected[i],', got: ',responses[i]);
	    haderrors = true;
	}
    }
    if (responses.length>expected.length) {
	console.error('mismatch: more responses than expected, superflous part:',responses.slice(expected.length));
	haderrors = true;
    }
    if (haderrors===true) {
	process.exit(1);
    } else {
	console.info('all went as expected');
	process.exit(0);
    }
}

try {
    const emitta = require('./index.js').emitter;
    const evan = require('./index.js').event;
    class testemitter extends emitta {
	constructor() {
	    super();
	}
    }
    var tr = new testemitter();
    tr.on('testevent',function(evobj) {
       addResponse('event1');
       addResponse(evobj.getPayload());
       evobj.setPayload(null);
       evobj.setResult('hurray');
    });
    tr.on('testevent',function(evobj) {
       addResponse('event2');
       addResponse(evobj.getPayload());
       addResponse(evobj.getResult());
       evobj.cancelEvent();
    });
    tr.on('testevent',function(evobj) {
       addResponse('event3');
    });
    addResponse(tr.listeners('testevent').length);
    addResponse(tr.eventNames().pop());
    tr.emit(new evan('testevent','testpayload'));
}
catch(e) {
    addResponse(e);
}

matchResponses([3,'testevent','event1','testpayload','event2',null,'hurray']);

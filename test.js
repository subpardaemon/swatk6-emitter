const tstr = require('@swatk6/tester');

var tester = new tstr();

try {
    var emitta = require('./index.js').emitter;
    var evan = require('./index.js').event;
    class testemitter extends emitta {
	constructor(origi) {
	    super();
	    this.origi = origi;
	}
    }
    var tr = new testemitter('base');
    tr.on('testevent',function(evobj) {
       tester.addResponse('event1');
       tester.addResponse(evobj.getPayload());
       evobj.setPayload(null);
       evobj.setResult('hurray');
    });
    tr.on('testevent',function(evobj) {
       tester.addResponse('event2');
       tester.addResponse(evobj.getPayload());
       tester.addResponse(evobj.getResult());
       evobj.cancelEvent();
    });
    tr.on('testevent',function(evobj) {
       tester.addResponse('event3');
    });
    tester.addResponse(tr.listeners('testevent').length);
    tester.addResponse(tr.eventNames().pop());
    tr.emit(new evan('testevent','testpayload'));
}
catch(e) {
    tester.addResponse(e,true,'exception (base block)');
}

if (tester.matchResponses([3,'testevent','event1','testpayload','event2',null,'hurray'])===false) {
    process.exit(1);
}

tester = new tstr();

try {
    class testemitter extends emitta {
	constructor(origi) {
	    super();
	    this.origi = origi;
	}
    }
    tr = new testemitter('base');
    var callorder = 0, callorder2 = 0;
    tr.setOrder(evan.PROPAGATES_DOWN,evan.PROPAGATES_LOCAL,evan.PROPAGATES_UP,evan.PROPAGATES_SIBLINGS);
    var child01 = new testemitter('child0-1');
    child01.setOrder(evan.PROPAGATES_DOWN,evan.PROPAGATES_UP,0,0);
    var child11 = new testemitter('child1-1');
    var child12 = new testemitter('child1-2');
    var parent01 = new testemitter('parent0-1');
    var sibling1 = new testemitter('sibling-1');
    tr.addChild(child01);
    child01.addChild(child11);
    child01.addChild(child12);
    parent01.addChild(tr);
    parent01.addChild(sibling1);
    // normal spread test
    child01.on('testevent2',function(evobj) {
	++callorder;
	tester.addResponse(callorder,false,'child spread 0-1, should never happen :: '+this.origi);
    });
    child11.on('testevent2',function(evobj) {
	++callorder;
	tester.addResponse(callorder,1,'child spread 1-1 :: '+this.origi);
    });
    child12.on('testevent2',function(evobj) {
	++callorder;
	tester.addResponse(callorder,2,'child spread 1-2 :: '+this.origi);
    });
    tr.on('testevent2',function(evobj) {
	++callorder;
	tester.addResponse(callorder,3,'local spread 1 :: '+this.origi);
    });
    tr.on('testevent2',function(evobj) {
	++callorder;
	tester.addResponse(callorder,4,'local spread 2 :: '+this.origi);
    });
    parent01.on('testevent2',function(evobj) {
	++callorder;
	tester.addResponse(callorder,5,'parent spread 1 :: '+this.origi);
    });
    sibling1.on('testevent2',function(evobj) {
	++callorder;
	tester.addResponse(callorder,6,'sibling spread 1 :: '+this.origi);
    });
    // saturation test
    tr.on('satevent',function(evobj) {
	++callorder2;
	tester.addResponse(callorder2,1,'saturation: local spread 1 :: '+this.origi);
    });
    sibling1.on('satevent',function(evobj) {
	++callorder2;
	tester.addResponse(callorder2,2,'saturation: sibling spread 1 :: '+this.origi);
    });
    child01.on('satevent',function(evobj) {
	++callorder2;
	tester.addResponse(callorder2,3,'saturation: child spread 0-1 :: '+this.origi);
    });
    child11.on('satevent',function(evobj) {
	++callorder2;
	tester.addResponse(callorder2,4,'saturation: child spread 1-1 :: '+this.origi);
    });
    child12.on('satevent',function(evobj) {
	++callorder2;
	tester.addResponse(callorder2,5,'saturation: child spread 1-2 :: '+this.origi);
    });
    parent01.on('satevent',function(evobj) {
	++callorder2;
	tester.addResponse(callorder2,6,'saturation: parent spread 1 :: '+this.origi);
    });
    var evv = new evan('testevent2');
    evv.setPropagation(evan.PROPAGATES_DOWN|evan.PROPAGATES_LOCAL|evan.PROPAGATES_UP|evan.PROPAGATES_SIBLINGS);
    tr.emitEvent(evv);
    var evv2 = new evan('satevent');
    evv2.setPropagation(evan.PROPAGATES_LOCAL|evan.PROPAGATES_SATURATING);
    tr.emitEvent(evv2);
}
catch(e) {
    tester.addResponse(e,true,'exception (hierarchy block)');
}

if (tester.matchResponses([1,2,3,4,5,6,1,2,3,4,5,6])===false) {
    process.exit(1);
}

process.exit(0);

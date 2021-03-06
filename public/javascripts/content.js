let connectionMessage = null;
let startedAt = Date.now();

let showConnectionErrorMessage = function showConnectionErrorMessage(){
  if ((!connectionMessage  || !webix.message.pull.connectionError) && Date.now() - startedAt > 3000) {
    connectionMessage = webix.message({
      id: 'connectionError',
      type: "error",
      text: '<span><i class="fa fa-refresh fa-spin fa-fw"></i></span> Trying to connect to poloLender app... <br> There seems to be a connection issue',
      expire: -1,
    });
  }
};

let hideConnectionErrorMessage = function hideConnectionErrorMessage() {
  if (connectionMessage) {
    webix.message.hide(connectionMessage);
    connectionMessage = null;
  }
};

let header = {
  id: 'header',
  view: 'template',
  type: 'header',
  autoheight:true,
  css: 'header',
  borderless: true,
  template: function(obj) { return obj.value; },
  data: { value: 'poloLender Pro' },
};


let tabview = {
  view: 'tabview',
  multiview: { keepViews: true },
  sizeToContent: true,
  id: 'contentTabview',
  animate: { type: "flip", subtype: "vertical" },
  cells:[
    { header: "Status", body:{ view:"scrollview", scroll: "xy", body: statusView } },
    { header: "Performance", body:{ view:"scrollview", scroll: "xy", body: performanceReportView } },
    { header: "Live", body:{ view:"scrollview", scroll: "xy", body: liveView } },
    { header: "History", body:{ view:"scrollview", scroll: "xy", body: historyView } },
    { header: "About", body:{ view:"scrollview", scroll: "xy", body: aboutView } },
  ],
};

webix.ready(function () {
  webix.ui({
      rows: [
        header,
        tabview,
      ]
  });

  $$("lendingHistoryInputForm").elements["period"].attachEvent("onChange", onPeriodChange);
  webix.extend($$('lendingHistoryTable'), webix.ProgressBar);

  socket.on('connect', function () {
    poloLenderAppConnection = 'connected';
    hideConnectionErrorMessage();
    updatePoloLenderApp();
  });
  socket.on('reconnect', function () {
    poloLenderAppConnection = 'connected';
    hideConnectionErrorMessage();
    updatePoloLenderApp();
  });
  socket.on("connect_error", function (err) {
    poloLenderAppConnection = `connect error, ${err.type}: ${err.message}`;
    showConnectionErrorMessage();
    updatePoloLenderApp();
  });
  socket.on("reconnect_error", function (err) {
    poloLenderAppConnection = `reconnect error, ${err.type}: ${err.message}`;
    showConnectionErrorMessage();
    updatePoloLenderApp();
  });
  socket.on('disconnect', function () {
    poloLenderAppConnection = 'disconnected';
    showConnectionErrorMessage();
    updatePoloLenderApp();
  });
  socket.on("reconnecting", function (attemptNumber) {
    poloLenderAppConnection = `reconnecting (${attemptNumber})`;
    showConnectionErrorMessage();
    updatePoloLenderApp();
  });


  let onevent = socket.onevent;
  socket.onevent = function (packet) {
    let args = packet.data || [];
    onevent.call(this, packet);    // original call
    packet.data = ['*'].concat(args);
    onevent.call(this, packet);      // additional call to catch-all
  };
  socket.on('*', function (event, data) {
  });

  socket.on('advisorConnection', updateAdvisorConnection);
  socket.on('clientMessage', updateClientMessage);
  socket.on('advisorInfo', updateAdvisorInfo);
  socket.on('poloLenderApp', updatePoloLenderApp);
  socket.on('apiCallInfo', updateApiCallInfo);
  socket.on('performanceReport', updatePerformanceReport);
  socket.on('liveUpdates', updateLive);
  socket.on('lendingHistory', updateLendingHistory);

  advisorInfoTableUi = $$('advisorInfoTable');
  poloLenderApp_restaredAtUi = $$('poloLenderApp_restartedAt');
  poloLenderApp_apiActivityUi = $$('poloLenderApp_apiActivity');
  startRefreshingStatus();
  startRefreshingLiveUpdateStatus();
});

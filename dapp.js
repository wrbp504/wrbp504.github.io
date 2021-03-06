const CryptoJS = window.CryptoJS;
let ckjson;
let hash;


async function loadJSON() {
  const response = await fetch('./contracts/ContractKeeperReduced.json');
  ckjson = await response.json();
}
loadJSON();

// HTML elements
var dropzoneId = "right-side";
const mmAccount = document.getElementById('mm-account');
const mmConnect = document.getElementById("mm-connect");
const dropContainer = document.getElementById(dropzoneId);
const ckAdd = document.getElementById("ck-add");
const ckFile = document.getElementById('ck-file');
const ckFile2 = document.getElementById("ck-file2");
const ckFname = document.getElementById('ck-fname');
const ckContent = document.getElementById("ck-content");
const ckSign = document.getElementById("ck-sign");
const ckSubmit = document.getElementById("ck-submit");
const details = document.getElementById("details");
const messageArea = document.getElementById("message-area");


//Metamask function

mmConnect.onclick = async () => {

  if ((await selectedAddress()) !== "") {
    mmConnect.style.display = "none";
  }
}

async function selectedAddress() {
  if (typeof window.ethereum !== 'undefined') {

    var accounts = await ethereum.request({
      method:
        'eth_accounts'
    });

    if (accounts.length == 0) {
      try {
        accounts = await ethereum.request({
          method:
            'eth_requestAccounts'
        });
      }
      catch (err) {
        accounts = [];
        alert("Connection failed : " + getReason(err));
        return "";
      }
    }
  }
  if (accounts.length !== 0) {
    await setHandlers();
    return accounts[0].toLowerCase();
  }
}

async function setHandlers() {
  ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length > 0) {
      mmAccount.innerHTML =
        accounts[0];
      if (ckSubmit.style.display == "") {
        inputForm();
      } else {
        verifyContract();
      }
    }
    else {
      window.location.reload();
    }
    // verifyContract();
  });
  ethereum.on('chainChanged', (_chainId) => window.location.reload());
}

//Page load and drop control

window.addEventListener('load', async function () {
  if (typeof window.ethereum === 'undefined') {
    alert("Please install Metamask and reload page");
  } else {
    var accounts = await ethereum.request({
      method:
        'eth_accounts'
    });
    if (accounts.length > 0) {
      mmAccount.innerHTML = accounts[0];
    } else {
      mmAccount.innerHTML = "Metamask not connected";
    }
    setHandlers();
  }
})

console.log(typeof dropContainer);
dropContainer.ondragover = dropContainer.ondragenter = function (evt) {
  evt.preventDefault();
};

dropContainer.ondrop = function (evt) {
  evt.preventDefault();
  ckFile.files = evt.dataTransfer.files;
  handleFile(ckFile.files[0]);
};

window.addEventListener("dragenter", function (e) {
  if (e.target.id != dropzoneId) {
    e.preventDefault();
    e.dataTransfer.effectAllowed = "none";
    e.dataTransfer.dropEffect = "none";
  }
}, false);

window.addEventListener("dragover", function (e) {
  if (e.target.id != dropzoneId) {
    e.preventDefault();
    e.dataTransfer.effectAllowed = "none";
    e.dataTransfer.dropEffect = "none";
  }
});

window.addEventListener("drop", function (e) {
  console.log("i??m here");
  if (e.target.id != dropzoneId) {
    e.preventDefault();
    e.dataTransfer.effectAllowed = "none";
    e.dataTransfer.dropEffect = "none";
  }
});
ckFile.onchange = async (event) => {
  handleFile(event.target.files.item(0));
}


async function handleFile(file) {

  let fl = file.name.length;
  if (fl < 4 || String(file.name).substring(fl - 4, fl).toLowerCase().localeCompare(".pdf")) {
    alert("invalid file type, must be pdf");
    return;
  }
  ckFname.innerHTML = "  " + file.name;

  let reader = new FileReader();
  let binaryString;

  reader.onload = function () {
    binaryString = reader.result;
    hash = CryptoJS.SHA256(binaryString);
    ckContent.innerText = hash.toString(CryptoJS.enc.Hex);
    const pdfvisor = document.getElementById("pdfvisor");
    pdfvisor.src = "data:application/pdf;base64, " + encodeURI(btoa(binaryString));
    verifyContract();
  }
  reader.readAsBinaryString(file);
}



ckFile2.onclick = async () => {
  if (typeof window.ethereum === 'undefined') {
    alert("Please install Metamask and reload page");
    return;
  }
  ckFile.click();
}

//Contract Related function
//Error parse

function getReason(err) {
  let resp = "";
  let errjsonstr = String(err);
  console.log("typeof " + typeof errjsonstr);
  let pr = errjsonstr.search("object Object");
  if (pr>=0){
    errjsonstr=JSON.stringify(err);
  }
  let arr = /("code": *[-0-9]*)/.exec(errjsonstr);
  console.log("arr "+arr);
  if (arr !== null) {
    resp =  arr[1]+"  ";
  }
  arr = /"reason": *"([^"]*)"/.exec(errjsonstr);
  console.log("arr "+arr);
  if (arr !== null) {
    resp+=  arr[1];
    return  resp;
  }
  arr = /"message": *"([^"]*)"/.exec(errjsonstr);
  console.log("arr "+arr);
  if (arr !== null) {
    return resp+arr[1];
  }

    return resp + errjsonstr.substring(0, 160) + "...";
}


async function verifyContract() {

  console.log("ENTRANDO A verifyCOntract()");

  let SCResponse;
  let accounts;

  if (!ckContent.innerText.localeCompare("")) {
    return;
  }

  details.innerHTML = `
  <label>Signer 1:</label>
  <div id="account1"  style="color: white;width:95%"></div>
  <div id="name1"  style="color: white;width:95%"></div>
  <br>
  <label>Signer 2:</label>
  <div id="account2"  style="color: white;width:95%"></div>
  <div id="name2"  style="color: white;width:95%"></div>
  <br>
  <label>Signer 3:</label>
  <div id="account3"  style="color: white;width:95%"></div>
  <div id="name3"  style="color: white;width:95%"></div>
  <br>
  `
  const account1 = document.getElementById("account1");
  const name1 = document.getElementById("name1");
  const account2 = document.getElementById("account2");
  const name2 = document.getElementById("name2");
  const account3 = document.getElementById("account3");
  const name3 = document.getElementById("name3");

  if (typeof window.ethereum === 'undefined') {
    alert("Please install Metamask and reload page");
    return;
  }
  let web3 = new Web3(window.ethereum)
  web3.eth.handleRevert = false;
  const networkId = await web3.eth.net.getId();

  console.log("NetworkId " + networkId);

  if (typeof ckjson.networks[networkId] === 'undefined') {
    alert("contract not deployed on NetwordId " + networkId);
    return;
  }

  console.log("ckjson.networks[networkId].address " + ckjson.networks[networkId].address);

  const contractKeeper = await new web3.eth.Contract
    (ckjson.abi, ckjson.networks[networkId].address);

  try {
    SCResponse = await contractKeeper.methods.getLegalContract("0x" + hash.toString(CryptoJS.enc.Hex)).call();
  } catch (err) {
    account1.innerHTML = "";

    ckSubmit.style.display = "none";
    ckSign.style.display = "none";
    messageArea.innerHTML = getReason(err);

    if (String(messageArea.innerHTML).search("Contract") >= 0) {
      ckAdd.style.display = "";
    }

    return false;
  }

  const legalContract = SCResponse[0];

  account1.innerHTML = legalContract.signers[0] + "<strong>" + (SCResponse[1][0] ? " SIGNED" : " NOT SIGNED") + "</strong>";
  name1.innerHTML = legalContract.signersNames[0];

  account2.innerHTML = legalContract.signers[1] + "<strong>" + (SCResponse[1][1] ? " SIGNED" : " NOT SIGNED") + "</strong>";
  name2.innerHTML = legalContract.signersNames[1];

  if (legalContract.signers.length == 3) {

    account3.innerHTML = legalContract.signers[2] + "<strong>" + (SCResponse[1][2] ? " SIGNED" : " NOT SIGNED") + "</strong>";
    name3.innerHTML = legalContract.signersNames[2];

  } else {
    account3.innerHTML = "---"
    name3.innerHTML = "---";
  }

  ckAdd.style.display = "none";
  ckSubmit.style.display = "none";
  selAdd = mmAccount.innerHTML;
  ckSign.style.display = "none";
  for (i = 0; i < legalContract.signers.length; i++) {
    if (legalContract.signers[i].toLowerCase().localeCompare(selAdd) == 0 && !SCResponse[1][i]) {
      ckSign.style.display = "";
      break;
    }
  }
  switch (parseInt(legalContract.state)) {
    case 1:
      messageArea.innerHTML = "Accounts labeled NOT SIGNED, must be selected first in Metamask to sign";
      console.log(String(!mmAccount.innerHTML) + " test ")
      if (!String(mmAccount.innerHTML).localeCompare("Metamask not connected")) {
        mmConnect.style.display = "";
      }
      break;
    case 2:
      messageArea.innerHTML = "Already signed contracts are view only";
      break;
    case 0:
      messageArea.innerHTML = "Click Add Contract to add contract"
      break;
  }
  return true;
}



ckAdd.onclick = async () => {
  if (typeof window.ethereum === 'undefined') {
    alert("Please install Metamask and reload page");
    return;
  }

  console.log("*********   antes     ***********");
  ckSubmit.style.display = "";

  if ((await selectedAddress()) == "") {
    verifyContract();
    return;
  }
  ckAdd.style.display = "none";
  console.log("*********   despues     ***********");
  inputForm();

};

function inputForm() {

  details.innerHTML = `
  <label>Signer 1:</label>
  <div id="account1"  style="color: white;width:95%"></div>
  <input id="name1" type="text" placeholder="Name1" style="width:95%">
  <br><label>Signer 2:</label>
  <input id="account2" type="text" placeholder="Account2" style="width:95%">
  <input id="name2" type="text" placeholder="Name2" style="width:95%">
  <br><label>Signer 3:</label>
  <input id="account3" type="text" placeholder="Account3" style="width:95%">
  <input id="name3" type="text" placeholder="Name3" style="width:95%">
  `
  account1.innerHTML = selectedAddress().then((account) => {
    document.getElementById("account1").innerHTML = account;
  });
  messageArea.innerHTML = "Beware that form will be reset if new account is selected in Metamask!!!!"

}



ckSubmit.onclick = async () => {

  const account1 = document.getElementById('account1');
  if (!/^0[xX][0-9a-fA-F]{40}$/.test(account1.innerHTML)) {
    alert("Invalid account 1 format");
    return;
  }
  const name1 = document.getElementById('name1');
  if (name1.value === "") {
    alert("Name 1 Should not be empty");
    return;
  }

  let accs = [account1.innerHTML];
  let names = [name1.value];

  const account2 = document.getElementById('account2');
  if (!/^0[xX][0-9a-fA-F]{40}$/.test(account2.value)) {
    alert("Invalid account 2 format");
    return;
  }
  accs.push(account2.value);

  const name2 = document.getElementById('name2');
  if (name2.value === "") {
    alert("Name 2 Should not be empty");
    return;
  }
  names.push(name2.value);

  const account3 = document.getElementById('account3');
  if (account3.value !== "" && !/^0[xX][0-9a-fA-F]{40}$/.test(account3.value)) {
    alert("Invalid account 3 format");
    return;
  }

  const name3 = await document.getElementById('name3');
  if (account3.value !== "" && name3.value === "") {
    alert("Name 3 Should not be empty");
    return;
  }

  if (account3.value !== "") {
    accs.push(account3.value);
    names.push(name3.value);
  }

  if (!account1.innerHTML.toLowerCase().localeCompare(account2.value.toLowerCase()) ||
    !account1.innerHTML.toLowerCase().localeCompare(account3.value.toLowerCase()) ||
    !account2.value.toLowerCase().localeCompare(account3.value.toLowerCase())) {
    alert("account should have different values")
    return;
  }

  if (typeof window.ethereum === 'undefined') {
    alert("Please install Metamask and reload page");
    return;
  }

  let web3 = new Web3(window.ethereum)
  const networkId = await web3.eth.net.getId();

  const contractKeeper = new web3.eth.Contract
    (ckjson.abi, ckjson.networks[networkId].address);

  messageArea.innerHTML = "PROCESSING PLEASE WAIT";
  console.log("PROCCESSING");

  try {
    const response = await contractKeeper.methods
      .addLegalContract("0x" + hash.toString(CryptoJS.enc.Hex),
        accs,
        names).send({ from: await selectedAddress(), value: 1 });

  } catch (error) {
    console.log("transaction failed\n");
    alert("Trasaction failed, reason: " + getReason(error));
  }
  await verifyContract();
}

ckSign.onclick = async () => {
  if (typeof window.ethereum === 'undefined') {
    alert("Please install Metamask and reload page");
    return;
  }

  let web3 = new Web3(window.ethereum)
  const networkId = await web3.eth.net.getId();

  const contractKeeper = new web3.eth.Contract
    (ckjson.abi, ckjson.networks[networkId].address);



  if (typeof ckjson.networks[networkId] === 'undefined') {
    alert("ContratKepper not deployed on Netword Id " + networkId);
    return;
  }
  messageArea.innerHTML = "PROCESSING PLEASE WAIT";
  console.log("PROCCESSING");
  try {
    const response = await contractKeeper.methods
      .signContract("0x" + hash.toString(CryptoJS.enc.Hex)).send({ from: await selectedAddress() });
  } catch (error) {
    console.log("transaction failed\n");
    alert("Trasaction failed, reason: " + getReason(error));
  }
  await verifyContract();
}
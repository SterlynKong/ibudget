// declare variable that is equalt to indexedDB of platform used to access app
const indexedDB =
    window.indexedDB ||
    window.mozIndexedDB ||
    window.webkitIndexedDB ||
    window.msIndexedDB ||
    window.shimIndexedDB;


// create global variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'ibudget' and set it to version 1
const request = indexedDB.open('ibudget', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = ({ target }) => {
    // save a reference to the database 
    const db = target.result;
    // create an object store (table) called `new_items`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('offline_items', { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = target.result;

    // IF the app is online then attempt to sync with server DB
    if (navigator.onLine) {
        syncWithDB();
    }
};

request.onerror = ({ target }) => {
    // log error in console
    console.log("Error: " + target.errorCode);
};


// This function will be executed if we attempt to submit a new item and there's no internet connection
function saveRecord(record) {
    // open a new transaction with indexedDB with read and write permissions 
    const transaction = db.transaction(['offline_items'], 'readwrite');

    // access the object store for `new_item`
    const offlineItemStore = transaction.objectStore('offline_items');

    // add record to your store with add method
    offlineItemStore.add(record);
}

// This function will be executed if the app is online to sync indexedDB data with Server DB
function syncWithDB() {
    // open a transacion to indexedDB
    const transaction = db.transaction(['offline_items'], 'readwrite');

    // access the object store
    const offlineItemStore = transaction.objectStore('offline_items');

    // declare variable and store all offline_items retreived from the object store
    const getAllItems = offlineItemStore.getAll();

    getAll.onsuccess = function () {
        // if there are offline items in indexedDB's store, send it to the api for processing by the server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                // parse server response as JSON
                .then(response => response.json())
                // process the server response and show error if one exists
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // Cleanup of indexedDB
                    // open a new transaction to indexedDB
                    const transaction = db.transaction(['offline_items'], 'readwrite');
                    // access the object store
                    const offlineItemStore = transaction.objectStore('offline_items');
                    // clear all items in your store
                    offlineItemStore.clear();

                    alert('Data successfully synced with server!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

// listen for server becoming accessible / app going online
window.addEventListener('online', syncWithDB);
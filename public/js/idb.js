// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'ibudget' and set it to version 1
const request = indexedDB.open('ibudget', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = ({ target }) => {
    // save a reference to the database 
    const db = target.result;
    // create an object store (table) called `new_item`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_item', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = ({ target }) => {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = target.result;

    // check if app is online, if yes run uploadItem() function to send all local db data to api
    if (navigator.onLine) {
        checkDbOnline();
    }
};

request.onerror = ({ target }) => {
    // log error here
    console.log(target.errorCode);
};


// This function will be executed if we attempt to submit a new item and there's no internet connection
function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['offline_item'], 'readwrite');

    // access the object store for `new_item`
    const itemObjectStore = transaction.objectStore('offline_item');

    // add record to your store with add method
    itemObjectStore.add(record);
}

// This function will be executed if we attempt to submit a new item and there's no internet connection
function checkDb() {
    
}

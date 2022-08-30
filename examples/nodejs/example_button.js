
// if you use Windows OS, comment out this:
// const noble = require('@abandonware/noble')({extended: false});
const noble = require('@abandonware/noble');

const Button = require('../../dist/packages/block/Button');
const block = new Button.Button();

const Base = require('../../dist/packages/block/Base');
const meshBlock = new Base.Base();
const SERVICE_UUIDS = [meshBlock.UUIDS.SERVICE_ID];
const CHARACTERISTIC_UUIDS = [
    meshBlock.UUIDS.CHARACTERISTICS.INDICATE,
    meshBlock.UUIDS.CHARACTERISTICS.NOTIFY,
    meshBlock.UUIDS.CHARACTERISTICS.WRITE,
    meshBlock.UUIDS.CHARACTERISTICS.WRITE_WO_RESPONSE
];

function handleError(err) {
    console.log(err);
}

async function discoverCharacteristics(peripheral) {
    const services = await peripheral.discoverServicesAsync(SERVICE_UUIDS).catch(handleError);
    const tmpChara = await services[0].discoverCharacteristicsAsync(CHARACTERISTIC_UUIDS).catch(handleError);
    // sort to fix random order of characteristic
    const characteristics = tmpChara.sort(function (a, b) {
        return a.properties[0].toLowerCase() < b.properties[0].toLowerCase() ? -1 : 1;
    });
    return characteristics;
}

function command2buf(command) {
    return Buffer.from(command, "hex");
}

async function sleep(milliseconds) {
    const sleep = time => new Promise(resolve => setTimeout(resolve, time));
    (async () => {
        await sleep(milliseconds);
    })();
}

async function setupBlock(characteristics) {
    // Subscribe indicate
    await characteristics[0].subscribeAsync();
    characteristics[0].on('data', async function (data, isNotification) {
        block.indicate(data);
        void isNotification;
    })

    // Subscribe notify
    await characteristics[1].subscribeAsync();
    characteristics[1].on('data', async function (data, isNotification) {
        block.notify(data);
        void isNotification;
    })

    // Send activation command of MESH block functions
    await characteristics[2].writeAsync(command2buf(meshBlock.featureCommand), false).catch(handleError);
    console.log("ready");
}

async function main() {

    // Start scanning
    await noble.startScanningAsync(SERVICE_UUIDS, false).catch(handleError);
    console.log('start scan');

    // Discovered
    noble.on('discover', async (peripheral) => {

        console.log(`discovered: ${peripheral.advertisement.localName}`);

        // Check peripheral
        if (!Button.Button.isMESHblock(peripheral.advertisement.localName)) {
            return;
        }

        // Stop scanning when target block discovered
        await noble.stopScanningAsync().catch(handleError);

        // Connect to the device
        await peripheral.connectAsync().catch(handleError);
        console.log(`connected: ${peripheral.advertisement.localName}`);

        // Discover characteristics
        const characteristics = await discoverCharacteristics(peripheral);

        // Setup MESH block with initial communication
        await setupBlock(characteristics);

        // Event handler
        block.onSinglePressed = () => {
            console.log('Single Pressed')
        }
        block.onLongPressed = () => {
            console.log('Long Pressed')
        }
        block.onDoublePressed = () => {
            console.log('Double Pressed')
        }
    });
}

main();
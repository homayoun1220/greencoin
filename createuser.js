// 'use strict';
const { Wallets } = require("fabric-network");
const FabricCAServices = require("fabric-ca-client");
const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const { exec } = require("child_process");
function execPromise(command) {
    return new Promise(function (resolve, reject) {
        exec(command, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(stdout.trim());
        });
    });
}

// function replaceAll(str, find, replace) {
//     return str.replace(new RegExp(find, 'g'), replace);
// }

// async function createAff(aff,adminUser){
//     await Promise.all(aff.map(async (elem) => {
//         try {
//             const contents = await ca.newAffiliationService().create({ name: elem, force: true }, adminUser);
//             console.log(`7.1.1`);
//         } catch (error) {
//           console.log('error'+ error);
//         }
//       }))
// }

async function main() {
    try {
        // load the network configuration
        const ccp = yaml.safeLoad(fs.readFileSync(`./connection.json`, "utf8"));
        console.log(`1/10`);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(`./Org1`);
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`2/10`);

        // Check to see if we've already enrolled the user.
        const userIdentity = await wallet.get("javidi");
        if (userIdentity) {
            return;
        }
        console.log(`3/10`);

        // Check to see if we've already enrolled the admin user.
        const adminIdentity = await wallet.get(`Org1 CA Admin`);
        if (!adminIdentity) {
            return;
        }
        console.log(`4/10`);

        // Create a new CA client for interacting with the CA.
        const caURL =
            ccp.certificateAuthorities["org1ca-api.127-0-0-1.nip.io:8080"].url;
        const ca = new FabricCAServices(caURL);
        console.log(`5/10`);

        // build a user object for authenticating with the CA
        const provider = wallet
            .getProviderRegistry()
            .getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(
            adminIdentity,
            `Org1 CA Admin`
        );
        console.log(`6/10`);

        // Create the affiliations first.
        // var aff = JSON.parse(replaceAll(myArgs[4], "'", '"'))
        //important,new affiliation category
        await ca
            .newAffiliationService()
            .create({ name: "searcher", force: true }, adminUser);
        // await createAff(aff,adminUser);

        console.log(`7/10`);

        // Register the user, enroll the user, and import the new identity into the wallet.
        // attr_reqs:[{name:"test",optional:false},{name:"test2",optional:true}]
        const secret = await ca.register(
            {
                affiliation: "searcher",
                enrollmentID: "javidi",
                role: "client",
            },
            adminUser
        );
        console.log(`8/10`);
        // let enrollment;

        const enrollment = await ca.enroll({
            enrollmentID: "javidi",
            enrollmentSecret: secret,
        });
        x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: `Org1MSP`,
            type: "X.509",
        };

        console.log(`9/10`);
        await wallet.put(`javidi`, x509Identity);
        console.log(`created`);
    } catch (error) {
        console.log(error);
        process.exit(1);
    }
}
main();

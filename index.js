import pinataSDK from '@pinata/sdk';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Retrieve environment variables
const JWT = process.env.JWT;

const pinata = new pinataSDK({ pinataJWTKey: JWT});

async function catFile(cid) {
    const { createHelia } = await import('helia');
    const { unixfs } = await import('@helia/unixfs');

    const helia = await createHelia();
    const fs = unixfs(helia);

    const decoder = new TextDecoder();
    let jsonString = '';

    try {
        for await (const chunk of fs.cat(cid)) {
            jsonString += decoder.decode(chunk, {
                stream: true
            });
        }

        const jsonObject = JSON.parse(jsonString);
        console.log('Added file contents:', jsonObject);
    } catch (error) {
        console.error('Error while fetching file from IPFS:', error);
    } finally {
        await helia.stop(); // Properly close the Helia instance
    }
}

// * In case of listing des articles && listing des topics
/*
response:
{
    IpfsHash: This is the IPFS multi-hash provided back for your content,
    PinSize: This is how large (in bytes) the content you just pinned is,
    Timestamp: This is the timestamp for your content pinning (represented in ISO 8601 format)
}
*/
async function AddAndPinFileToIPFS(filePath, fileName) {
    const readableStreamForFile = fs.createReadStream(filePath);
    const options = {
        pinataMetadata: {
            name: fileName,
        },
        pinataOptions: {
            cidVersion: 0
        }
    };
    const res = await pinata.pinFileToIPFS(readableStreamForFile, options)
    console.log(res)
    return res
}

// * In case of Post article
/*
response:
{
    IpfsHash: This is the IPFS multi-hash provided back for your content,
    PinSize: This is how large (in bytes) the content you just pinned is,
    Timestamp: This is the timestamp for your content pinning (represented in ISO 8601 format)
}
*/
async function AddContentToIpfs(articleContent, articleId) {
    const body = {
        content: articleContent
    };
    const options = {
        pinataMetadata: {
            name: `articleContent${articleId}`,
        },
        pinataOptions: {
            cidVersion: 0
        }
    };
    const res = await pinata.pinJSONToIPFS(body, options)
    console.log(res)
    return res
}

function UpdatePinFromIPFS(previousHash, newContent, articleId) {
    DeletePinFromIPFS(previousHash);
    const res = AddContentToIpfs(newContent, articleId);
    //res.IpfsHash
    //update the CID in the database with res.IpfsHash
}

// In case of a delete article 
// response: 'OK'
async function DeletePinFromIPFS(hashToUnpin) {
    const res = await pinata.unpin(hashToUnpin)
    console.log(res)
}

async function testPinataAuth() {
    const res = await pinata.testAuthentication()
    console.log(res)
}

const articleContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
const newArticleContent = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Nec sagittis aliquam malesuada bibendum. Mauris rhoncus aenean vel elit. Justo eget magna fermentum iaculis eu non diam phasellus vestibulum. Sem integer vitae justo eget magna fermentum iaculis eu non. Nunc aliquet bibendum enim facilisis gravida neque convallis a cras. Aliquam purus sit amet luctus venenatis. Bibendum neque egestas congue quisque egestas diam in arcu. Ornare arcu dui vivamus arcu felis bibendum ut tristique. Ultrices sagittis orci a scelerisque purus semper eget. Duis tristique sollicitudin nibh sit amet commodo nulla. Ultrices mi tempus imperdiet nulla. Elementum tempus egestas sed sed risus pretium quam vulputate. Sit amet consectetur adipiscing elit ut aliquam purus. A arcu cursus vitae congue. Pellentesque habitant morbi tristique senectus et netus et.";

async function App() {
    // await testPinataAuth();

    // await AddAndPinFileToIPFS('./data/articles.json', "articles.json");

    // await AddContentToIpfs(articleContent, 1);

    // await UpdatePinFromIPFS("QmSZE7dNRiTSfZpgTCp69DpkQBGqpijMwwSoPKh9qEHPsW", newArticleContent, 1);

    // await handleRequest("QmYmddzbQTktSj6ajQ5JQmQyNChKVzznpcKoZ2tGu6DdGh");

    // await catFile("QmYmddzbQTktSj6ajQ5JQmQyNChKVzznpcKoZ2tGu6DdGh");

    // await DeletePinFromIPFS("QmTY2V23DVdGG9nvGXpDxLUwkgW38tCKX63QzeTMc1Tooh");
}

App().then(() => {
    console.log('App execution completed');
}).catch((error) => {
    console.error('Error during App execution:', error);
});
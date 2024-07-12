const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const axios = require('axios');
const path = require('path');


// Retrieve environment variables
const JWT = process.env.JWT;
const Anthologia_URL = process.env.Anthologia_URL;
const Pinata_URL = process.env.Pinata_URL;
const IPFS_Articles_FileName = process.env.IPFS_Articles_FileName;
const Anthologia_Api_Key = process.env.Anthologia_Api_Key;

// Pinata sdk
const pinata = new pinataSDK({ pinataJWTKey: JWT});

exports.ArticlesScript = async (req, res) => {
    const folderDestination= './tmp'
    const fileDestination = IPFS_Articles_FileName

    async function CreateFileFromArticles() {
        try {
            const response = await axios.get(
                `${Anthologia_URL}/articles`,
                {
                    headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': Anthologia_Api_Key
                    },
                    withCredentials: true,
                }
            )
    
            const jsonData = {
                articles: [],
            };
            const articles = response.data

            // console.log(articles)
            // Loop through the response data and add to jsonData
            for (const article of articles) {
                const tmp = {
                    'id': article.id,
                    'createdAt': article.createdAt,
                    'updatedAt': article.updatedAt,
                    'draft': article.draft,
                    'title': article.title,
                    'authordId': article.authorId,
                    'totalViews': article.viewCounter,
                    'totalLikes': article.likeCounter,
                    'topicId': article.topicId,
                    'cid': article.cid
                }
    
                jsonData.articles.push(tmp);
            }
    
            // Define the output file path
            const outputPath = path.join(folderDestination, fileDestination);
    
            // Write the JSON data to a file
            fs.writeFileSync(outputPath, JSON.stringify(jsonData, null, 2));
        } catch (error) {
            // Handle any errors that occurred during the fetch
            console.error("Error fetching data:", error);
        }
    }
    
    async function GetPreviousFileHash() {
        try {
            const response = await axios.get(`${Pinata_URL}/data/pinList`,
                {
                    headers: {
                        Authorization: `Bearer ${JWT}`
                    }
                }
            )
            const datas = response.data
            const rows = datas.rows
            
            for (const row of rows) {
                if (row.date_unpinned == null && row.metadata.name == fileDestination) {
                    console.log(row);
                    return row.ipfs_pin_hash;
                }
            }    
        } catch (err) {
            console.error(err)
            return 'not found'
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

    async function DeletePinFromIPFS(hashToUnpin) {
        const res = await pinata.unpin(hashToUnpin)
        console.log(res)
    }

    try {
        await CreateFileFromArticles()
        const previousHash = await GetPreviousFileHash()
        console.log(previousHash)
        if (previousHash && previousHash != undefined && previousHash != 'not found') {
            await DeletePinFromIPFS(previousHash)
        }
        await AddAndPinFileToIPFS(`${folderDestination}/${fileDestination}`, fileDestination);
        res.status(200).send('articles deployed successfully.')
    } catch (err) {
        res.status(500).send('fail during articles deployment.')
    }
};
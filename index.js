const tumblr = require('tumblr.js');
const fs = require('fs');

const clientSettings = require('./config.json');
const { downloadImage } = require('./utils/downloadImage');

const client = tumblr.createClient(clientSettings);

const blog = "positivedoodles"
const tags = ["doodles", "doodle"]

const photosToDownload = []

function getBlogPosts(offset) {
    return new Promise(resolve => {
        client.blogPosts(blog, { type: 'photo', offset, tag: tags }, function (err, resp) {
            resolve({ err, resp });
        })
    })
}

async function getTumblrImages(offset = 0) {
    const { err, resp } = await getBlogPosts(offset);
    if (err) {
        console.err(err);
        return;
    }
    for (const post of resp.posts) {
        let photoCounter = 0;
        for (const photo of post.photos) {
            if (photoCounter == 0) {
                console.log(photo);
            }
            photosToDownload.push({
                filename: `tumblr_${post.id}_${photoCounter}_${photo.original_size.width}.png`,
                url: photo.original_size.url,
            });
            photoCounter++;
        }
    }
    console.log("Photos retrieved so far: ", photosToDownload.length);
    if (resp.total_posts > offset + resp.posts.length) {
        console.log("Getting next batch of photos...")
        await getTumblrImages(offset + resp.posts.length);
    }
}

async function downloadAllPhotos() {
    console.log("Downloading all photos...")
    if (!fs.existsSync(blog)) {
        fs.mkdirSync(blog);
    }
    for (photo of photosToDownload) {
        await downloadImage(photo.url, photo.filename, blog, __dirname);
    }
}

async function main() {
    await getTumblrImages(0);
    console.log("All photos retrieved: ", photosToDownload.length);
    await downloadAllPhotos();
    console.log(`Done! All files downloaded to the /${blog} folder.`)
}

main();

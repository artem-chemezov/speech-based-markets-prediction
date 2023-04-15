require('log-timestamp');

const http = require("http");
const axios = require('axios');
const fs = require('fs');

const host = 'localhost';
const port = 9999;

const segmentationTimeout = 120000;
const language = 'ru';
const searcherUrl = 'http://10.32.1.30:8080';
const paths = {
    getVideos: searcherUrl + '/youtube/search_by_full_name',
    getVideoId: searcherUrl + '/youtube/get_youtube_video_from_link',
    startSegmentation: searcherUrl + '/youtube/download_videos',
    getSerializationStatus: searcherUrl + '/status/serialisation-result',
    startChartsGeneration: searcherUrl + '/ml/set_expert',
    getGenerationStatus: searcherUrl + '/status/charts-result',
}

const requestListener = function (req, res) {
        switch (req.url) {
            case "/start":
                // try {

                    handleStart(req);                    
                    res.writeHead(200);
                    res.end("");
                    return
    
                // } catch (e) {
                    // console.log(e);
                    res.writeHead(500);
                    res.end("Error");
                // }
        }

    
};

const handleError = (e) => {
    // console.error('status: ' + e.response.status)
    console.error('data: ' + JSON.stringify(e))
}

const handleStart = (req) => {

    let body = '';
    req.on('data', chunk => {
        body += chunk.toString(); // convert Buffer to string
    });
    req.on('end', () => {
        console.log(body);
        const data = JSON.parse(body);
        handleLinks(data.links);
    });

}

const handleLinks = async (links) => {

    for (link of links) {

        console.log('-----start link: ' + link)
        const searchId = await getSearchId();
        const videoId = await getVideoId(link);
        console.log(`Search: ${searchId} ||| Video: ${videoId}`);
        await startSegmentation(searchId, videoId, link, language);
        const expert = await waitForSegmentationAndGetExpert(videoId);
    
        console.log(`expert: ${expert}`);
        await startChartsGeneration(videoId, expert);
        const chartData = await waitForGenerationAndGetData(videoId);
    
        const chartDataStr = JSON.stringify(chartData);
        const fileName = `./${link.split('.com/')[1]}_${videoId}.json`;
        fs.writeFileSync(fileName, chartDataStr);
        console.log('-----end File: ' + fileName);

    };

}

const waitForSegmentationAndGetExpert = async (videoId) => {
    return new Promise((res, rej) => setTimeout(async () => {
        
        const data = await getSerializationStatus(videoId);
        const status = data.status;
        if (status === 'IN_PROGRESS')
            res(await waitForSegmentationAndGetExpert(videoId));
        else if (status === 'READY')
            res(data.expert);
    }, segmentationTimeout));
}

const waitForGenerationAndGetData = async (videoId) => {
    return new Promise((res, req) => setTimeout(async () => {
        
        const data = await getGenerationStatus(videoId);
        const status = data.status;
        if (status === 'IN_PROGRESS')
            res(await waitForGenerationAndGetData(videoId));
        else if (status === 'READY')
            res(data.data);
    }, segmentationTimeout));
}




const getSearchId = () => {
    const url = paths.getVideos + '?name=qweqwe&search_string=interview&count=1&lang_search_str=ru&language=en&region=US';
    return axios.get(url)
        .then(res => {
            let searchId = res.data.search_id;
            // console.log('Search ID:', searchId);
            return searchId;
        })
        .catch(handleError);
}

const getVideoId = (link) => {
    const url = paths.getVideoId;
    return axios.post(url, { link })
        .then(res => {
            let videoId = res.data.video_id;
            // console.log('Video ID: ' + videoId);
            return videoId;
        })
        .catch(handleError);
}

const startSegmentation = (searchId, videoId, link, language) => {
    const url = paths.startSegmentation;
    const data = { search_id: searchId, language, videos: [{ link, video_id: videoId }]};
    return axios.post(url, data)
        .then(res => {
            if (res.status === 200)
                console.log('Segmentation started for Video: ' + videoId);
            return videoId;
        })
        .catch(handleError);
}

const getSerializationStatus = (videoId) => {
    const url = paths.getSerializationStatus + `?video_id=${videoId}`;
    return axios.get(url)
        .then(res => {
            const status = res.data.status;
            console.log(`Video: ${videoId} Progress: ${res.data.progress} Status: ${status}`);
            const expert = status === 'READY' ? res.data.experts[0] : '';
            return { expert, status };
        })
        .catch(handleError);
}

const startChartsGeneration = (videoId, expert) => {
    const url = paths.startChartsGeneration;
    const data = {
        video_id: videoId, img: expert, entered_text: '', chosen_intervals: [],
        congruence: true, confidence: true, aggression: true
    };
    return axios.post(url, data)
        .then(res => {
            if (res.status === 202)
                console.log('Generation started for Video: ' + videoId);
            return videoId;
        })
        .catch(handleError);
}

const getGenerationStatus = (videoId) => {
    const url = paths.getGenerationStatus + `?video_id=${videoId}`;
    return axios.get(url)
        .then(res => {
            const status = res.data.status;
            console.log(`Video: ${videoId} Completed chrs: ${res.data.completed_characteristics} Status: ${status}`);
            return { data: res.data, status };
        })
        .catch(handleError);
}



const server = http.createServer(requestListener);
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});





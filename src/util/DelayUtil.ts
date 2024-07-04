export let setTimeDelay = async function (ms: number) {

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(true);
        }, ms);
    })

};


export let setFrameDelay = async function (frame: number) {
    return new Promise((resolve, reject) => {
        frame = Math.max(1, frame);
        let callback = function () {
            if (frame < 0) {
                resolve(true);
            } else {
                requestAnimationFrame(callback);
            }
            frame--;
        }
        requestAnimationFrame(callback);
    })

};
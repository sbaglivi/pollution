
function wrapper(fun) {
    let context = this; // should not be necessary here.
    function wrapped(...args) {
        wrapped.calls.push(args);
        return fun.apply(context, args);
    }
    wrapped.calls = [];
    return wrapped;
}
function countWrapper(fun) {
    let context = this; // should not be necessary here.
    function wrapped(...args) {
        wrapped.calls++;
        return fun.apply(context, args);
    }
    wrapped.calls = 0;
    return wrapped;
}

function resize(from, to, options = {}) {
    if (Object.keys(options).length) {
        for (let key in options) {
            switch (key) {
                case 'width':
                    checkValidity(options[key], 'width', 'number', 150, 900);
                    break;
                case 'height':
                    checkValidity(options[key], 'height', 'number', 150, 900);
                    break;
                case 'quality':
                    checkValidity(options[key], 'quality', 'number', 50, 100);
                    break;
                default:
                    throw Error(`Unkown option property ${key}. Accepted are: width, height, quality.`);
                    break;
            }
        }
    }
    console.log(`resizing image to ${options.width || 200}, ${options.height || 200}, ${options.quality || 90}`);
}
function checkValidity(value, fieldName, type, min, max) {
    if (typeof value !== type) throw Error(`Invalid ${fieldName} ${value}, type accepted is ${type} - received ${typeof value}`)
    if (value < min || value > max) throw Error(`Invalid ${fieldName} ${value}, min value accepted is ${min} and max value accepted is ${max}`)
}
resize('home', 'end', { width: 0x30a, height: 150, quality: 80 });

async function rejecter() {
    return new Promise((res, rej) => {
        rej(Error('error from promise'))
        // res('message from promise')
    })
}

async function we() {
    try {
        let message = await rejecter();
        console.log(message);
    } catch (e) {
        throw e;
    }
}

// we();


let apple = {
    name: 'tommy',
    eat: function (phrase) {
        console.log(`${this.name} says ${phrase}`);
    }
}

function wrapped(fun) {
    function temp(args) {
        fun.call(this, args);
        console.log(`I've been wrapped`)
    }
    return temp;
}

apple.eat('hey');
// apple.eat = wrapper(apple.eat);
apple.eat = wrapped(apple.eat);
apple.eat('hey');


res.render = function (fun) {
    return function (args) {
        fun.call(this, args);
        req.session.notification = '';
    }
}
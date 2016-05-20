; (function (global) {
    var size = 30;
    var start = 200;
    var notes = new Array();
    var noteElements = new Array();
    var results = new Array();
    var screenWidth = 0;

    var event_OnFinish;

    // 'new' an object
    var MusicSheet = function (width) {
        return new MusicSheet.init(width);
    }

    MusicSheet.prototype = {
        onFinish: function (toExecute) {
            event_OnFinish = toExecute;
        },

        createTest: function (notes) {
            this.clear();

            for (var i in notes) {
                this.createNote(notes[i]);
            }

            startTime = Date.now();
        },

        createNote: function (note) {
            var position = notes.length;

            var element = canvas.display.ellipse({
                x: this.getNodeCenterX(position),
                y: this.getNodeCenterY(note),
                radius_x: size / 2,
                radius_y: size / 3,
                stroke: "5px #555555"
            });

            canvas.addChild(element);
            notes[position] = note;
            noteElements[position] = element;

            if (note > 11) {
                for (var i = 12; i <= note; i++) {
                    if (i % 2 === 0) {
                        this.createSplitLine(i, position);
                    }
                }
            }

            if (note < 1) {
                for (var i = 0; i >= note; i--) {
                    this.createSplitLine(i, position);
                }
            }

            return this;
        },

        clear: function () {
            notes = new Array();
            noteElements = new Array();
            results = new Array();

            canvas.reset();
            this.drawSheetLines();
        },

        checkNote: function (note) {
            var currentValidation = results.length;

            if (notes[currentValidation] % 7 == note) {
                results[currentValidation] = 1;
                noteElements[currentValidation].stroke = "5px #00b926";
            }
            else {
                results[currentValidation] = 0;
                noteElements[currentValidation].stroke = "5px #ff0000";
            }

            canvas.redraw();

            if (results.length == notes.length) {
                this.finishTest();
            }
        },

        finishTest: function () {
            var correct = 0;
            var error = 0;
            var total = 0;
            var timeTaken = Date.now() - startTime;

            for (var i in results) {
                if (results[i] === 1) {
                    correct++;
                }
                else {
                    error++;
                }
                total++;
            }

            var finalValues = {
                correct: correct,
                error: error,
                total: total,
                timeTaken: timeTaken
            };

            event_OnFinish(finalValues);
        },

        createSplitLine: function(note, position) {
            if (note % 2 === 0) {
                canvas.addChild(canvas.display.line({
                    start: { x: this.getNodeCenterX(position) - size, y: this.getNodeCenterY(note) },
                    end: { x: this.getNodeCenterX(position) + size, y: this.getNodeCenterY(note) },
                    stroke: "5px #0aa",
                    cap: "round"
                }));
            }
        },

        getNodeCenterY: function(note) {
            return start + size * 5 - note * size / 2;
        },

        getNodeCenterX: function(position) {
            return size * 1.5 + position * size * 2.5;
        },

        drawSheetLines: function () {
            for (var i = 0; i < 5; i++) {
                canvas.addChild(canvas.display.line({
                    start: { x: size / 2, y: size * i + start },
                    end: { x: screenWidth, y: size * i + start },
                    stroke: "5px #0aa",
                    cap: "round"
                }));
            }
        }
    };

    // the actual object is created here, allowing us to 'new' an object without calling 'new'
    MusicSheet.init = function (width) {
        canvas = oCanvas.create({
            canvas: "#canvas"
        });

        screenWidth = width;
        this.drawSheetLines();
    }

    // trick borrowed from jQuery so we don't have to use the 'new' keyword
    MusicSheet.init.prototype = MusicSheet.prototype;

    // attach our Greetr to the global object, and provide a shorthand '$G' for ease our poor fingers
    global.MusicSheet = global.MS$ = MusicSheet;

}(window));
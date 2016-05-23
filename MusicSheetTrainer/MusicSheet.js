; (function (global) {
    var noteElements = new Array();
    var testResults = new Array();

    var options = {
        noteSize: 30,
        sheetStartPosition: 200, 
        sheetWidth: 900,
        canvasName: "#canvas",
        onFinish: function (results) { },
    };

    var testInformation = {
        notes: new Array(),
        passRate: 100,
        passTime: 0
    };

    var sheetStyle = {
        noteStroke: "5px #555555",
        noteStrokeCorrect: "5px #00b926",
        noteStrokeWrong: "5px #ff0000",
        lineStroke: "5px #0aa",
        lineCap: "round"
    }

    // 'new' an object
    var MusicSheet = function (userOptions, userSheetStyle) {
        return new MusicSheet.init(userOptions || {}, userSheetStyle || {});
    }

    MusicSheet.prototype = {
        createTest: function (userTestInformation) {
            this.clear();

            copyAttributes(testInformation, userTestInformation);

            for (var i in testInformation.notes) {
                this.createNote(testInformation.notes[i]);
            }

            testInformation.startTime = Date.now();
        },

        createNote: function (note) {
            var position = noteElements.length;

            var element = canvas.display.ellipse({
                x: this.getNodeCenterX(position),
                y: this.getNodeCenterY(note),
                radius_x: options.noteSize / 2,
                radius_y: options.noteSize / 3,
                stroke: sheetStyle.noteStroke
            });

            canvas.addChild(element);
            noteElements[position] = {
                note: note,
                element: element
            };

            // draw lines above the sheet
            if (note > 11) {
                for (var i = 12; i <= note; i++) {
                    if (i % 2 === 0) {
                        this.createSplitLine(i, position);
                    }
                }
            }

            // draw lines bellow the sheet
            if (note < 1) {
                for (var i = 0; i >= note; i--) {
                    this.createSplitLine(i, position);
                }
            }
        },

        clear: function () {
            noteElements = new Array();
            testResults = new Array();

            canvas.reset();
            this.drawSheetLines();
        },

        checkNote: function (note) {
            var currentValidation = testResults.length;

            if (noteElements[currentValidation].note % 7 == note) {
                testResults[currentValidation] = 1;
                noteElements[currentValidation].element.stroke = sheetStyle.noteStrokeCorrect;
            }
            else {
                testResults[currentValidation] = 0;
                noteElements[currentValidation].element.stroke = sheetStyle.noteStrokeWrong;
            }

            canvas.redraw();

            if (testResults.length == noteElements.length) {
                this.finishTest();
            }
        },

        finishTest: function () {
            var correct = 0;
            var error = 0;
            var total = 0;
            var timeTaken = Date.now() - testInformation.startTime;

            for (var i in testResults) {
                if (testResults[i] === 1) {
                    correct++;
                }
                else {
                    error++;
                }
                total++;
            }

            var testResult = {
                passed: (testInformation.passRate <= correct * 100 / total) && (testInformation.passTime === 0 || testInformation.passTime <= timeTaken),
                correct: correct,
                error: error,
                total: total,
                timeTaken: timeTaken,
                testInformation: testInformation
            };

            options.onFinish(testResult);
        },

        createSplitLine: function(note, position) {
            if (note % 2 === 0) {
                canvas.addChild(canvas.display.line({
                    start: { x: this.getNodeCenterX(position) - options.noteSize, y: this.getNodeCenterY(note) },
                    end: { x: this.getNodeCenterX(position) + options.noteSize, y: this.getNodeCenterY(note) },
                    stroke: sheetStyle.lineStroke,
                    cap: sheetStyle.lineCap
                }));
            }
        },

        getNodeCenterY: function(note) {
            return options.sheetStartPosition + options.noteSize * 5 - note * options.noteSize / 2;
        },

        getNodeCenterX: function(position) {
            return options.noteSize * 1.5 + position * options.noteSize * 2.5;
        },

        drawSheetLines: function () {
            for (var i = 0; i < 5; i++) {
                canvas.addChild(canvas.display.line({
                    start: { x: options.noteSize / 2, y: options.noteSize * i + options.sheetStartPosition },
                    end: { x: options.sheetWidth, y: options.noteSize * i + options.sheetStartPosition },
                    stroke: sheetStyle.lineStroke,
                    cap: sheetStyle.lineCap
                }));
            }
        },

        copyAttributes: function (target, src) {
            for (var key in src) {
                if (src[key] !== undefined) {
                    target[key] = src[key];
                }
            }

            return target;
        },
    };

    // the actual object is created here, allowing us to 'new' an object without calling 'new'
    MusicSheet.init = function (userOptions, userSheetStyle) {
        canvas = oCanvas.create({
            canvas: options.canvasName
        });

        copyAttributes(options, userOptions);
        copyAttributes(sheetStyle, userSheetStyle);

        this.drawSheetLines();
    }

    // trick borrowed from jQuery so we don't have to use the 'new' keyword
    MusicSheet.init.prototype = MusicSheet.prototype;

    // attach our MusicSheet to the global object, and provide a shorthand 'MS$' for ease our poor fingers
    global.MusicSheet = global.MS$ = MusicSheet;

}(window));
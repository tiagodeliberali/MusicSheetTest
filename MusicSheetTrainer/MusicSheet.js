; (function (global) {
    var noteElements = new Array();
    var testResults = new Array();
    var sheet = null;

    var options = {
        noteSize: 30,
        sheetStartPosition: 200, 
        sheetWidth: 900,
        onFinish: function (results) { },
    };

    var testInformation = {
        notes: new Array(),
        passRate: 100,
        passTime: 0
    };

    // 'new' an object
    var MusicSheet = function (userOptions, userSheetStyle) {
        return new MusicSheet.init(userOptions || {}, userSheetStyle || {});
    }

    MusicSheet.prototype = {
        createTest: function (userTestInformation) {
            this.clear();

            this.sheet.copyAttributes(testInformation, userTestInformation);

            for (var i in testInformation.notes) {
                this.createNote(testInformation.notes[i]);
            }

            testInformation.startTime = Date.now();
        },

        createNote: function (note) {
            var position = noteElements.length;

            var element = this.sheet.drawNote(
                options.noteSize, 
                this.getNodeCenterX(position),
                this.getNodeCenterY(note));

            noteElements[position] = {
                note: note,
                element: element
            };

            // draw lines above the sheet
            if (note > 11) {
                for (var i = 12; i <= note; i++) {
                    this.createSplitLine(i, position);
                }
            }

            // draw lines bellow the sheet
            if (note < 1) {
                for (var i = 0; i >= note; i--) {
                    this.createSplitLine(i, position);
                }
            }
        },

        createSplitLine: function (note, position) {
            if (note % 2 === 0) {
                this.sheet.drawSplitLine(
                    options.noteSize,
                    this.getNodeCenterX(position),
                    this.getNodeCenterY(note));
            }
        },

        clear: function () {
            noteElements = new Array();
            testResults = new Array();

            testInformation = {
                notes: new Array(),
                passRate: 100,
                passTime: 0
            };

            this.sheet.reset();
            this.drawSheetLines();
        },

        drawSheetLines: function () {
            for (var i = 0; i < 5; i++) {
                this.sheet.drawLine(options.sheetWidth, options.noteSize * i + options.sheetStartPosition);
            }
        },

        checkNote: function (note) {
            var currentValidation = testResults.length;

            if (noteElements[currentValidation] == undefined) {
                return;
            }

            if (noteElements[currentValidation].note % 7 == note) {
                testResults[currentValidation] = 1;
                this.sheet.setNoteAsCorrect(noteElements[currentValidation].element);
            }
            else {
                testResults[currentValidation] = 0;
                this.sheet.setNoteAsWrong(noteElements[currentValidation].element);
            }

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

        getNodeCenterY: function(note) {
            return options.sheetStartPosition + options.noteSize * 5 - note * options.noteSize / 2;
        },

        getNodeCenterX: function(position) {
            return options.noteSize * 1.5 + position * options.noteSize * 2.5;
        },
    };

    // the actual object is created here, allowing us to 'new' an object without calling 'new'
    MusicSheet.init = function (userOptions, userSheetStyle) {
        this.sheet = SheetDesigner(userSheetStyle);

        this.sheet.copyAttributes(options, userOptions);
        
        this.drawSheetLines();
    }

    // trick borrowed from jQuery so we don't have to use the 'new' keyword
    MusicSheet.init.prototype = MusicSheet.prototype;

    // attach our MusicSheet to the global object, and provide a shorthand 'MS$' for ease our poor fingers
    global.MusicSheet = global.MS$ = MusicSheet;



    // Responsible for drawing the sheet. Can be exchanged in future for a better library
    (function (global) {
        var canvas = null;

        var sheetStyle = {
            canvasName: "#canvas",
            noteStroke: "5px #555555",
            noteStrokeCorrect: "5px #00b926",
            noteStrokeWrong: "5px #ff0000",
            lineStroke: "5px #0aa",
            lineCap: "round"
        }

        // 'new' an object
        var SheetDesigner = function (userSheetStyle) {
            return new SheetDesigner.init(userSheetStyle || {});
        }

        SheetDesigner.prototype = {
            drawNote: function (size, x, y) {
                var element = this.canvas.display.ellipse({
                    x: x,
                    y: y,
                    radius_x: size / 2,
                    radius_y: size / 3,
                    stroke: sheetStyle.noteStroke
                });

                this.canvas.addChild(element);

                return element;
            },

            drawSplitLine: function (size, x, y) {
                var element = this.canvas.display.line({
                    start: { x: x - size, y: y },
                    end: { x: x + size, y: y },
                    stroke: sheetStyle.lineStroke,
                    cap: sheetStyle.lineCap
                });

                this.canvas.addChild(element);

                return element;
            },

            drawLine: function (width, y) {
                var element = this.canvas.display.line({
                    start: { x: 0, y: y },
                    end: { x: width, y: y },
                    stroke: sheetStyle.lineStroke,
                    cap: sheetStyle.lineCap
                });

                this.canvas.addChild(element);

                return element;
            },

            reset: function () {
                this.canvas.reset();
            },

            setNoteAsCorrect: function (element) {
                element.stroke = sheetStyle.noteStrokeCorrect;
                this.canvas.redraw();
            },

            setNoteAsWrong: function (element) {
                element.stroke = sheetStyle.noteStrokeWrong;
                this.canvas.redraw();
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
        SheetDesigner.init = function (userSheetStyle) {
            this.canvas = oCanvas.create({
                canvas: sheetStyle.canvasName
            });

            this.copyAttributes(sheetStyle, userSheetStyle);
        }

        // trick borrowed from jQuery so we don't have to use the 'new' keyword
        SheetDesigner.init.prototype = SheetDesigner.prototype;

        // attach our MusicSheet to the global object, and provide a shorthand 'MS$' for ease our poor fingers
        global.SheetDesigner = SheetDesigner;

    }(window));

}(window));
; (function (global) {
    var noteElements = new Array();
    var testResults = new Array();
    var sheet = null;

    var options = {
        /* POSITIONS */
        noteSize: 30,
        sheetStartPosition: 70, 
        sheetWidth: 900,
        startScreenPosition: 10,
        killPosition: 150,
        killArea: 50,

        /* DRAWING FRAMEWORK */
        canvasName: "#canvas",
        fps: 60,
        
        /* STYLES */
        noteStroke: "5px #555555",
        noteStrokeCorrect: "5px #00b926",
        noteStrokeWrong: "5px #ff0000",
        lineStroke: "5px #0aa",
        killLineStroke: "5px #bbbbbb",
        lineCap: "round",

        /* EVENTS */
        onFinish: function (results) { },
        onNoteIsKilled: function () { },
    };

    var testInformation = {};

    // 'new' an object
    var MusicSheet = function (userOptions) {
        return new MusicSheet.init(userOptions || {});
    }

    MusicSheet.prototype = {
        createTest: function (userTestInformation) {
            var self = this;

            self.clear();
            self.sheet.copyAttributes(testInformation, userTestInformation);

            for (var i in testInformation.notes) {
                (function (position) {
                    setTimeout(
                        function () { self.createNote(testInformation.notes[position], testInformation.timeToKillNote); },
                        i * testInformation.timeBetweenNotes);
                }(i));
            }

            testInformation.startTime = Date.now();
        },

        createNote: function (note, timeToKill) {
            var position = noteElements.length;
            var x = timeToKill > 0 ? options.sheetWidth : this.getNodeCenterX(position);

            var element = this.sheet.drawNote(
                options.noteSize,
                timeToKill,
                x,
                this.getNodeCenterY(note));

            noteElements[position] = {
                note: note,
                element: element
            };

            // draw lines above the sheet
            if (note > 11) {
                for (var i = 12; i <= note; i++) {
                    this.createSplitLine(i, x, timeToKill);
                }
            }

            // draw lines bellow the sheet
            if (note < 1) {
                for (var i = 0; i >= note; i--) {
                    this.createSplitLine(i, x, timeToKill);
                }
            }
        },

        createSplitLine: function (note, position, timeToKill) {
            if (note % 2 === 0) {
                this.sheet.drawSplitLine(
                    options.noteSize,
                    timeToKill,
                    position,
                    this.getNodeCenterY(note));
            }
        },

        clear: function () {
            noteElements = new Array();
            testResults = new Array();

            testInformation = {
                notes: new Array(),
                passRate: 100,
                passTime: 0,
                timeBetweenNotes: 1000,
                timeToKillNote: 6000
            };

            this.sheet.reset();
            this.drawSheetLines();
        },

        drawSheetLines: function () {
            this.sheet.drawKillArea(
                options.sheetStartPosition - options.noteSize,
                options.noteSize * 7.5,
                options.killArea);

            for (var i = 0; i < 5; i++) {
                this.sheet.drawLine(options.sheetWidth, options.noteSize * i + options.sheetStartPosition);
            }

            this.sheet.drawClef('images/GClef.png');
        },

        checkNote: function (note) {
            var currentValidation = testResults.length;

            if (noteElements[currentValidation] == undefined || noteElements[currentValidation].element.x > options.killPosition + options.killArea) {
                return;
            }

            if ((7777 + noteElements[currentValidation].note) % 7 == note) {
                testResults[currentValidation] = 1;
                this.sheet.setNoteAsCorrect(noteElements[currentValidation].element);
            }
            else {
                testResults[currentValidation] = 0;
                this.sheet.setNoteAsWrong(noteElements[currentValidation].element);
            }

            if (testResults.length == testInformation.notes.length) {
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
    MusicSheet.init = function (userOptions) {
        var self = this;

        self.copyAttributes(options, userOptions);

        self.sheet = SheetDesigner(options);

        self.drawSheetLines();
    }

    // trick borrowed from jQuery so we don't have to use the 'new' keyword
    MusicSheet.init.prototype = MusicSheet.prototype;

    // attach our MusicSheet to the global object, and provide a shorthand 'MS$' for ease our poor fingers
    global.MusicSheet = global.MS$ = MusicSheet;



    // Responsible for drawing the sheet. Can be exchanged in future for a better library
    (function (global) {
        var canvas = null;
        var sheetOptions = {}

        // 'new' an object
        var SheetDesigner = function (userSheetOptions) {
            return new SheetDesigner.init(userSheetOptions || {});
        }

        SheetDesigner.prototype = {
            drawNote: function (size, timeToKill, x, y) {
                var self = this;

                var element = this.canvas.display.ellipse({
                    x: x,
                    y: y,
                    radius_x: size / 2,
                    radius_y: size / 3,
                    stroke: sheetOptions.noteStroke
                });

                this.canvas.addChild(element);

                if (timeToKill || 0 > 0) {
                    (function (note) {
                        note.animate({
                            x: sheetOptions.killPosition,
                            y: y,
                        }, {
                            duration: timeToKill,
                            easing: "linear",
                            callback: function () {
                                if (note.stroke === sheetOptions.noteStroke) {
                                    sheetOptions.onNoteIsKilled();
                                }
                            }
                        });
                    }(element));
                }

                return element;
            },

            drawSplitLine: function (size, timeToKill, x, y) {
                var element = this.canvas.display.line({
                    start: { x: x - size, y: y },
                    end: { x: x + size, y: y },
                    stroke: sheetOptions.lineStroke,
                    cap: sheetOptions.lineCap
                });

                this.canvas.addChild(element);

                if (timeToKill || 0 > 0) {
                    element.animate({
                        x: sheetOptions.killPosition,
                        y: y,
                    }, {
                        duration: timeToKill,
                        easing: "linear",
                    });
                }

                return element;
            },

            drawLine: function (width, y) {
                var element = this.canvas.display.line({
                    start: { x: sheetOptions.startScreenPosition, y: y },
                    end: { x: width, y: y },
                    stroke: sheetOptions.lineStroke,
                    cap: sheetOptions.lineCap
                });

                this.canvas.addChild(element);

                return element;
            },

            drawKillArea: function (start, end, killArea) {
                var line = this.canvas.display.line({
                    start: { x: sheetOptions.killPosition, y: start },
                    end: { x: sheetOptions.killPosition, y: end },
                    stroke: sheetOptions.killLineStroke,
                    cap: sheetOptions.lineCap
                });

                this.canvas.addChild(line);

                var rectangle = this.canvas.display.rectangle({
                    x: sheetOptions.killPosition,
                    y: start,
                    width: killArea,
                    height: end - start,
                    fill: "#EEEEEE"
                });

                this.canvas.addChild(rectangle);

                return line;
            },

            drawClef: function(clefName) {
                var image = this.canvas.display.image({
                    x: 177,
                    y: 120,
                    origin: { x: 150, y: 90 },
                    image: clefName
                });

                this.canvas.addChild(image);
            },

            reset: function () {
                this.canvas.reset();
            },

            setNoteAsCorrect: function (element) {
                element.stroke = sheetOptions.noteStrokeCorrect;
                this.canvas.redraw();
            },

            setNoteAsWrong: function (element) {
                element.stroke = sheetOptions.noteStrokeWrong;
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
        SheetDesigner.init = function (userSheetOptions) {
            this.copyAttributes(sheetOptions, userSheetOptions);

            this.canvas = oCanvas.create({
                canvas: sheetOptions.canvasName
            });
        }

        // trick borrowed from jQuery so we don't have to use the 'new' keyword
        SheetDesigner.init.prototype = SheetDesigner.prototype;

        // attach our MusicSheet to the global object, and provide a shorthand 'MS$' for ease our poor fingers
        global.SheetDesigner = SheetDesigner;

    }(window));

}(window));
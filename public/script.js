// Strings Code from Google Experiments, 2012 
// https://experiments.withgoogle.com/jam-with-chrome

// Shim by Paul Irish
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/

      window.requestAnimFrame = (function() {
        return  window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                window.oRequestAnimationFrame ||
                window.msRequestAnimationFrame ||
                function(callback) {
                    window.setTimeout(callback, 1000 / 60);
                };
    })();
    
    // Grab the elements from the dom
    function Stage(id) {
      this.el = document.getElementById(id);
      
      // Find the position of the stage element
      this.position();
      // Listen for events
      this.listeners();
      // Listen for hits
      this.hitZones = [];
      return this;
    }
    
    Stage.prototype.position = function() {
      var offset = this.offset();
      this.positionTop = Math.floor(offset.left);
      this.positionLeft = Math.floor(offset.top);
    };
    
    Stage.prototype.offset = function() { 
      var _x, _y,
          el = this.el;
      
      if (typeof el.getBoundingClientRect !== "undefined") {
        return el.getBoundingClientRect();
      } else {
        _x = 0;
        _y = 0;
        while(el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
          _x += el.offsetLeft;
          _y += el.offsetTop;
          el = el.offsetParent;
        }
        return { top: _y - window.scrollY, left: _x - window.scrollX };
      }
    };
    
    Stage.prototype.listeners = function() {
      var _self = this;
      
      _self.dragging = false;
      _self.limit = false;
      _self.isHoveringOverString = false;
      _self.hoveringString = null;
      
      window.addEventListener('resize', function() {
        _self.position();
      }, false);
      
      window.addEventListener('scroll', function() {
        _self.position();
      }, false);
      
      this.el.addEventListener('mousemove', function(e) {
        var x = e.clientX - _self.positionTop,
            y = e.clientY - _self.positionLeft;
    
        _self.isHoveringOverString = false;
        _self.hitZones.forEach(function(zone) {
            if(_self.checkPoint(x, y, zone)){
              _self.isHoveringOverString = true;
              _self.hoveringString = zone;
            }
        });

        // console.log(_self.isHoveringOverString);
        if(_self.isHoveringOverString){
          document.getElementById("stage").style.cursor = "pointer";
        }
        else{
          document.getElementById("stage").style.cursor = "default";
        }
    
        _self.dragging = true;
        if(!_self.prev){
          _self.prev = [x, y];
        }
        
      }, false);

      document.addEventListener("click", function(e){
        if(_self.isHoveringOverString && _self.hoveringString){
          _self.hoveringString.string.strum();
          instrument.playNote(_self.hoveringString);
        }
      });
      
      
      document.addEventListener('mousemove', function(e) {
        var x, y;
    
        if (!_self.dragging || _self.limit) return;
        _self.limit = true;
    
        x = e.clientX - _self.positionTop,
        y = e.clientY - _self.positionLeft;
        
        
    
    
        _self.hitZones.forEach(function(zone) {
          _self.checkIntercept(_self.prev[0], 
                               _self.prev[1],
                               x, 
                               y,
                               zone);
        });
    
        _self.prev = [x, y];
    
        setInterval(function() {
          _self.limit = false;
        }, 50);      
      }, false);
      
      document.addEventListener('mouseup', function(e) {
        var x, y;
        
        if (!_self.dragging) return;
        _self.dragging = false;
        
        x = e.clientX - _self.positionTop,
        y = e.clientY - _self.positionLeft;
      
        _self.hitZones.forEach(function(zone) {
          _self.checkIntercept(_self.prev[0], 
                               _self.prev[1],
                               x, 
                               y,
                               zone);
        });
      }, false);
    };
    
    Stage.prototype.check = function(x, y, zone) {
      if(!zone.el) return;
    
      if(zone.inside(x, y)){
        zone.el.classList.add('hit');
        this.el.classList.add('active');
      }else{
        zone.el.classList.remove('hit');
        this.el.classList.remove('active');
      }
    };
    
    Stage.prototype.addRect = function(id) {
      var el = document.getElementById(id),
          rect = new Rect(el.offsetLeft, 
                          el.offsetTop, 
                          el.offsetWidth, 
                          el.offsetHeight  
                          );
      rect.el = el;
    
      this.hitZones.push(rect);
      return rect;
    };

    Stage.prototype.addString = function(rect, string) {
      rect.string = string;
      
      this.hitZones.push(rect);
      return rect;
    }; 
    
    Stage.prototype.checkPoint = function(x, y, zone) {
      if(zone.inside(x, y)) {
        // zone.string.strum();
        return true;
      }
      else{
        // console.log(zone,x,y);
        return false;
      }
    };  
    
    Stage.prototype.checkIntercept = function(x1, y1, x2, y2, zone) {
       if(zone.intercept(x1, y1, x2, y2)) {
        // console.log("Intercept Called")
        zone.string.strum();
       }
      //  console.log(zone, x1,y1,x2,y2);
     }; 

    
    function Rect(i, x, y, width, height) {
      this.stringnum = i;
      this.x = x;
      this.y = y;
      this.width = width;
      this.height = height;
        
      return this;
    }
    
    Rect.prototype.inside = function(x,y) {
      return x >= this.x && y >= (this.y - this.height * 3)
          && x <= this.x + this.width
          && y <= this.y + this.height;
    };
    
    Rect.prototype.midLine = function() {
      if (this.middle) return this.middle;
  
      this.middle = [
          {x: this.x, y: this.y + this.height / 2},
          {x: this.x + this.width, y: this.y + this.height / 2}
      ]
      return this.middle;
    };
    
    Rect.prototype.intercept = function(x1, y1, x2, y2) {
      var result = false,
              segment = this.midLine(),
              start = {x: x1, y: y1},
              end = {x: x2, y: y2};
      if(this.intersectLine(segment[0], segment[1], start, end)){
        // console.log(this, segment[0], segment[1], start, end);
        instrument.playNote(this);
      }
      if(this.inside(x1,y1)){
        // console.log('Did not intercept, debug info:');
        // console.log(segment[0], segment[1], start, end);
        // console.log('end <--');
      }
      
      // console.log(this.intersectLine(segment[0], segment[1], start, end));
      return this.intersectLine(segment[0], segment[1], start, end);
    };
    
    Rect.prototype.intersectLine = function(a1, a2, b1, b2) {
      //-- http://www.kevlindev.com/gui/math/intersection/Intersection.js
      var result,
          ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
          ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
          u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);
  
      if (u_b != 0) {
        var ua = ua_t / u_b;
        var ub = ub_t / u_b;

        if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
            result = true;
        } else {
            result = false; //--"No Intersection"
        }
      } else {
        if (ua_t == 0 || ub_t == 0) {
            result = false; //-- Coincident"
        } else {
            result = false; //-- Parallel
        }
      }
      return result;
    };

    // Rect.prototype.update = function() {
    //     this.width = window.innerWidth * 0.8;
    // }
    
    function GuitarString(rect) {
        this.x = rect.x;
        this.y = rect.y + rect.height / 2;
        this.rectangle = rect;
        this.width = rect.width;
        this._strumForce = 0;
        this.a = 0;
    }
    
    GuitarString.prototype.strum = function() {
      this._strumForce = 8;
    //   document.getElementById('audiotag1').play();
      // console.log("Strum called");
    };
    
    GuitarString.prototype.render = function(ctx, canvas) {
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.bezierCurveTo(
              this.x, this.y + Math.sin(this.a) * this._strumForce,
              this.x + this.width, this.y + Math.sin(this.a) * this._strumForce,
              this.x + this.width, this.y);
      ctx.stroke();
      
      this._strumForce *= 0.95;
      this.a += 0.5;
    };
    
    
    function StringInstrument(stageID, canvasID, stringNum){
        this.strings = [];
        this.canvas = document.getElementById(canvasID);
        this.stage = new Stage(stageID);
        this.ctx = this.canvas.getContext('2d');
        this.stringNum = stringNum;
        this.create();
        this.render();
    
        return this;
    }
    
    StringInstrument.prototype.create = function() {
      for (var i = 0; i < this.stringNum; i++) {
        var srect = new Rect(i, 10, 90 + i * 75, window.innerWidth * 0.8, 5);
        var s = new GuitarString(srect);
        this.stage.addString(srect, s);
        this.strings.push(s);
      }
    };
    
    StringInstrument.prototype.render = function() {
      var _self = this;
      
      requestAnimFrame(function(){
        _self.render();
      });
      
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      
      for (var i = 0; i < this.stringNum; i++) {
        this.strings[i].render(this.ctx);
        // this.strings[i].rectangle.update();
      }
    };
    
    function Instrument() {
      //Samples from London Philaharmonic
      this.violinPlayer = new Tone.Sampler(
        {
          "A4" : "samples/violin-a4.mp3" //Unknown lol
        }
      );
      this.violaPlayer = new Tone.Sampler(
        {
          "D4" : "samples/viola-d4.mp3" //viola_D4_05_mezzo-piano_arco-normal
        }
      );
      this.celloPlayer = new Tone.Sampler(
        {
          "D3" : "samples/cello-d3.mp3", //cello_D3_15_fortissimo_arco-normal
          "D4" : "samples/cello-d4.mp3" //cello_D3_15_fortissimo_arco-normal
        }
      );
      this.bassPlayer = new Tone.Sampler(
        {
          "D2" : "samples/bass-d2.mp3", //double-bass_D2_15_forte_arco-normal
          "D3" : "samples/bass-d3.mp3" //double-bass_D3_15_forte_arco-normal
        }
      );
      //TODO: scales don't seem quite right
      this.violinScale = ["A4", "B4", "C4", "D4", "E4", "F4", "G4", "A5"];
      this.violaScale = ["D4", "E4", "F4", "G4", "A5", "B5", "C5", "D5"];
      this.celloScale = ["D3", "E3", "F3", "G3", "A4", "B4", "C4", "D4"];
      this.bassScale = ["D2", "E2", "F2", "G2", "A3", "B3", "C3", "D3"];
      this.currentScale = this.violinScale;
      this.currentPlayer = this.violinPlayer;
      this.initialize();
      this.muted = false;
      return this;
    }

    Instrument.prototype.initialize = function(){
      this.violinPlayer.toMaster();
      this.violaPlayer.toMaster();
      this.celloPlayer.toMaster();
      this.bassPlayer.toMaster();
    }

    Instrument.prototype.changeInstrument = function(name){
      console.log("Changed Instrument to " + name);
      if(name == "Violin"){
        this.currentScale = this.violinScale;
        this.currentPlayer = this.violinPlayer;
        $("#clefimage").css({"top": "-40px",
        "height": "150%"});
        $("#clefimage").attr("src", "img/trebleclef.png");
      }
      else if(name == "Viola"){
        this.currentScale = this.violaScale;
        this.currentPlayer = this.violaPlayer;
        $("#clefimage").css({"top": "0px",
        "height": "100%"});
        $("#clefimage").attr("src", "img/tenorclef.png");
      }
      else if(name == "Cello"){
        this.currentScale = this.celloScale;
        this.currentPlayer = this.celloPlayer;
        $("#clefimage").css({"top": "0px",
        "height": "100%"});
        $("#clefimage").css("top", "-75px");
        $("#clefimage").attr("src", "img/tenorclef.png");
      }
      else if(name == "Bass"){
        this.currentScale = this.bassScale;
        this.currentPlayer = this.bassPlayer;
        $("#clefimage").css({"top": "40px",
        "height": "75%"});
        $("#clefimage").attr("src", "img/bassclef.png");
      }
      else{
        console.log(name + " Instrument Not Found! ");
      }
    }

    Instrument.prototype.playNote = function(zone){
      if(this.currentPlayer.loaded){
        if(zone.stringnum == 0){
          this.currentPlayer.triggerAttackRelease(this.currentScale[0], 1);
        }
        if(zone.stringnum == 1){
          this.currentPlayer.triggerAttackRelease(this.currentScale[2], 1);
        }
        if(zone.stringnum == 2){
          this.currentPlayer.triggerAttackRelease(this.currentScale[4], 1);
        }
        if(zone.stringnum == 3){
          this.currentPlayer.triggerAttackRelease(this.currentScale[6], 1);
        }
      }

      Instrument.prototype.toggleMute = function(){
        if(this.muted){
          Tone.Master.mute = true;
          $("#muteButtonIcon").attr("class", "fas fa-volume-up");
        }
        else{
          Tone.Master.mute = false;
          $("#muteButtonIcon").attr("class", "fas fa-volume-mute");
        }
        this.muted = !this.muted
      }
    }
    
    
    // Connect the player output to the computer's audio output
    
    
    //Create new string object
    var strings = new StringInstrument("stage", "strings", 4);

    //Create new instrument object
    var instrument = new Instrument();

    //Initialize as Violin
    instrument.changeInstrument("Violin");

    //hack for responsive design - refresh page 
    window.onresize = function(){ location.reload(); }

    //check for select menu changes
    $('.dropdown-item').click(function() {
      instrument.changeInstrument($(this).text());
    });

    $('#muteButton').click(function() {
      instrument.toggleMute();
    });
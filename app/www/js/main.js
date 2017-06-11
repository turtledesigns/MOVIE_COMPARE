var filmRatingsArray = {},
    unknownMovies = new Array(),
    AdMob,
    uniqueID,
    deviceID = "-",
    movieObject = {
        id: "imdbID",
        title: "Title",
        rating: "imdbRating",
        year: "Year",
        poster: "Poster",
        actors: "Actors",
        genre: "Genre",
        director: "Director",
        runtime: "Runtime",
        plot: "Plot",
        response: "Response",
    },
    debugMode = true,
    advertsShowing = false,
    NOT_APPLICABLE = "N/A",
    MAX_INPUTS = 5,
    loaded = {
        device: false,
        angular: false
    };

document.addEventListener('deviceready', this.onDeviceReady, false);
//document.addEventListener('DOMContentLoaded', this.onDeviceReady, false);

function onDeviceReady() {
    if (window.plugins && window.plugins.uniqueDeviceID) {
        window.plugins.uniqueDeviceID.get(getDeviceIDSuccess, getDeviceIDFail);
    } else if (debugMode) {
        getDeviceIDSuccess('DEBUG-MODE');
    }
	
	if (cordova.platformId == 'android') {
		StatusBar.backgroundColorByHexString("#333");
	}

    function getDeviceIDSuccess(uuid) {
        deviceID = uuid;
        loaded.device = true;
        if (loaded.angular) {
            setTimeout(function(){
                $("#logo-screen").hide();
                $("#loading-screen").hide();
            },1000)
        }
    }

    function getDeviceIDFail(uuid) {
        deviceID = "null";
    }
}

var App = angular.module('MCApp', ['ngSanitize']);

App.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit(attr.onFinishRender);
                });
            }
        }
    };
});
App.controller('MCController', main);

function main($scope, $http) {
    $scope.numberCount = 1;
    $scope.heading = "Compare";
    $scope.movieReturnCtr = 0;
    $scope.add_fields = function () {
        $scope.numberCount++;

        if ($scope.numberCount >= 2 && $scope.numberCount <= MAX_INPUTS) {
            $("#tags" + ((MAX_INPUTS + 1) - $scope.numberCount) + "_status").attr('src', 'img/invalid.png');
            $("#tags" + ((MAX_INPUTS + 1) - $scope.numberCount) + "").show();
            $("#tags" + ((MAX_INPUTS + 1) - $scope.numberCount) + "_status").css('display', 'inline-block');
            $("#tags" + ((MAX_INPUTS + 1) - $scope.numberCount) + "").focus();

            if ($scope.numberCount == MAX_INPUTS) {
                $("#add").css('pointer-events', 'none');
                $("#add").css('opacity', '0.3');
            }
        }

    };
    $scope.number = MAX_INPUTS;
    $scope.getNumber = function (num) {
        return new Array(num);
    };

    function getMovieList() {
        var allMovies = "";

        for (var i = 1; i <= MAX_INPUTS; i++) {
            var movieTagNum = $("#tags" + i),
                movieNameSearch = movieTagNum.val();

            if (movieNameSearch == "") continue; //exit loop if field has no value

            if (movieTagNum.attr('movie-id')) movieNameSearch = 'id:' + movieTagNum.attr('movie-id');
            allMovies = allMovies + movieNameSearch + "\n";
        }

        allMovies = allMovies.replace(/^\s+|\s+$/g, ""); // removing any empty lines

        if (allMovies === "") {
            alert("Please add one or more movie titles to search for.");
            return;
        } else {
            $("#loading-screen").show();
            $("#content").hide();
            $("#content").hide();
            $("#tableCompare").hide();
        }

        return allMovies.split("\n");
    }

    $scope.getRatings = function () {

        uniqueID = generateGuid(); // unique search ID for metrics

        if (AdMob && advertsShowing) {
            AdMob.showInterstitial(); // show Advert on load
        }

        var originalMovieInputList = getMovieList(),
            listOfMovies,
            movieID;

        for (var x in originalMovieInputList) {
            // Check if we need to search on title or id

            listOfMovies = originalMovieInputList[x];

            movieID = (listOfMovies.match(/(^id:)(.*)/) === null) ? '' : listOfMovies.replace(/(^id:)(.*)/, "$2");


            var title = "",
                year = "",
                movieReg = /(^.*)\s\((\d\d\d\d)\)$/,
                tvReg = /(^.*)\s\((\d\d\d\d).(\d\d\d\d)\)$/;

            if ((listOfMovies.match(movieReg) === null) && (listOfMovies.match(tvReg) === null)) {
                title = listOfMovies;
            } else {
                title = (listOfMovies.match(movieReg) === null) ? (listOfMovies.match(tvReg) === null) ? '' : listOfMovies.replace(tvReg, "$1") : listOfMovies.replace(movieReg, "$1");
                year = (listOfMovies.match(movieReg) === null) ? (listOfMovies.match(tvReg) === null) ? '' : listOfMovies.replace(tvReg, "$2") : listOfMovies.replace(movieReg, "$2"); //movie search
            }
            title = title.replace("#", ""); // title cleanup

            var searchUrl;

            if (movieID !== "") {
                searchUrl = "http://www.omdbapi.com/?plot=full&i=" + movieID;
            } else if (title !== "" && year !== "") {
                searchUrl = "http://www.omdbapi.com/?plot=full&y=" + year + "&t=" + title;
            } else {
                searchUrl = "http://www.omdbapi.com/?plot=full&t=" + title;
            }

            $http.get(searchUrl, {
                    params: {
                        title: title
                    }
                })
                .then(function (res) {
                    var movieResults = res.data;
                    $scope.movieReturnCtr++;

                    if (movieResults[movieObject.response] === "False") {
                        unknownMovies.push(res.config.params.title);
                    } else {
                        if (movieResults[movieObject.id] && (movieResults[movieObject.rating] === NOT_APPLICABLE)) {
                            filmRatingsArray["0.0"] = movieResults;
                        } else if (movieResults[movieObject.id]) {
                            filmRatingsArray[movieResults[movieObject.rating]] = movieResults;
                        }
                    }


                    if ($scope.movieReturnCtr == originalMovieInputList.length) {

                        var sortedMovieArrayKeys = [];

                        for (var k in filmRatingsArray) {
                            if (filmRatingsArray.hasOwnProperty(k)) {
                                sortedMovieArrayKeys.push(k);
                            }
                        }
                        sortedMovieArrayKeys.sort();
                        sortedMovieArrayKeys.reverse(); // sorting movie object keys into order

                        for (var index = 0; index < sortedMovieArrayKeys.length; index++) {

                            movieResults = filmRatingsArray[sortedMovieArrayKeys[index]];

                            // Movie found - Push to list
                            var moviePosterImg = (movieResults[movieObject.poster] === NOT_APPLICABLE) ? "img/noMovieImg.png" : "http://turtle-designs.com/imdb/img.php?imgurl=" + movieResults[movieObject.poster];

                            var fontClass = (index === 0) ? "gold" : (index === 1) ? "silver" : (index === 2) ? "bronze" : "other";

                            $('#h3Title' + (index + 1))
                                .attr("style", "border-bottom: 1px; border-color: #666; border-style: solid;")
                                .append(
                                    $('<div/>')
                                    .attr("id", "container")
                                    .html('<div id="rating"><div class="' + fontClass + '">' + movieResults[movieObject.rating] + '</div></div><div id="name">' + movieResults[movieObject.title] + ' (' + movieResults[movieObject.year] + ')</div>')

                                ),


                                $('.movieRated_' + (index + 1)).append(
                                    $('<ul/>')
                                    .addClass('movie-data')
                                    .html('<div id="id"><img src="' + moviePosterImg + '" class="imgClass"></div><div id="id1" style="padding-left: 92px;"><li>Actors: ' + movieResults[movieObject.actors] + '</li><li>Genre: ' + movieResults[movieObject.genre] + '</li><li>Director: ' + movieResults[movieObject.director] + '</li><li>Runtime: ' + movieResults[movieObject.runtime] + '</li><li>Plot: ' + movieResults[movieObject.plot] + '<br><a class="imdbLink" target="_blank" href="http://imdb.com/title/' + movieResults[movieObject.id] + '">See on IMDb</a></div></li>')
                                );

                            logMovieName(movieResults[movieObject.title], movieResults[movieObject.rating], movieResults[movieObject.id], callbackFunction);

                        }

                        var currentIndex = index;
                        for (index = 0; index < unknownMovies.length; index++) {
                            $('.movieRated_' + (index + 1 + currentIndex)).empty();
                            $('.movieRated_' + (index + 1 + currentIndex)).append(
                                $('<li/>')
                                .css("padding-left", "10px")
                                .html("<strong>" + unknownMovies[index] + " - No results returned for the movie. </strong>")
                            );
                            logMovieName(unknownMovies[index], "-", "-", callbackFunction);
                        }

                        $("#loading-screen").hide();
                        $("#mainWrapper").css("padding", "30px 0 0 0");
                        $scope.heading = "Results";
                        $("#movie_results").show();
                        $("#content").val("");
                        $("#resetAll").show();

                        document.addEventListener("backbutton", function (e) {
                            if ($scope.heading === "Results") {
                                window.location.reload();
                            } else {
                                navigator.app.exitApp();
                            }
                        }, false);

                        return false;
                    };

                });
        }
    };

    $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
        //you also get the actual event object
        //do stuff, execute functions -- whatever...


        for (var n = 1; n <= MAX_INPUTS; n++) {
            $("#h3Title" + n).removeClass();
            $("#tags" + n).attr("data-int", n);
            $("#tags" + n).autocomplete({
                minLength: 0,
                delay: 20,
                source: "http://turtle-designs.com/imdbComp/suggest.php",
                select: function (event, ui) {
                    if (ui && ui.item && ui.item.movieID) {
                        var dataInt = $(this).attr("data-int");
                        $("#tags" + dataInt).attr('movie-id', ui.item.movieID);
                        $("#ui-id-" + dataInt).attr('value', '');
                        $("#tags" + dataInt + "_status").attr('src', 'img/valid.png');
                    }
                },
                search: function (event, ui) {
                    var dataInt = $(this).attr("data-int");
                    $("#tags" + dataInt).attr('movie-id', '');
                    $("#ui-id-" + dataInt).attr('value', 'showing');
                    $("#tags" + dataInt + "_status").attr('src', 'img/loading.gif');
                    if (event.currentTarget.value.length === 0) {
                        $("#tags" + n + "_status").attr('src', 'img/invalid.png');
                        $("#ui-id-" + n).html("");
                    }
                }
            }).data("uiAutocomplete")._renderItem = function (ul, item) {
                console.log(ul.context.id.split("ui-id-").join(""));
                $("#tags" + ul.context.id.split("ui-id-").join("") + "_status").attr('src', 'img/invalid.png');
                return $("<li></li>")
                    .data("item.autocomplete", item)
                    .append('<a id="ui-id-51" class="ui-corner-all" tabindex="-1">' + item.label + " (" + item.year + ")" + '</a>')
                    .appendTo((item.q == "TV series" || item.q == "TV Series" || item.q == "feature") ? ul : '');
            };
        }

        for (var j = 1; j <= (MAX_INPUTS - 1); j++) {
            $("#tags" + j).hide();
        }
        $("#tags" + MAX_INPUTS).focus();
        $("#resetAll").hide();
        $("#tags" + MAX_INPUTS + "_status").css('display', 'inline-block');

        for (var i = 1; i <= MAX_INPUTS; i++) {
            $("#tags" + i).focus(function () {
                for (var k = 1; k <= MAX_INPUTS; k++) {
                    $("#ui-id-" + k).attr("value", "");
                }
            });
        }

        for (var i = 1; i <= MAX_INPUTS; i++) {
            $("#tags" + i).focus(function () {
                $(this).blur(function () {
                    $("#ui-id-" + (this.id).replace("tags", "")).attr("value", "");
                });
            });
        }


        $("#accordian h3").click(function () {
            for (var l = 1; l <= MAX_INPUTS; l++) {
                $("#h3Title" + l).removeClass();
            }
            //slide up all the link lists
            $("#accordian .movie-data").slideUp();
            //slide down the link list below the h3 clicked - only if its closed
            if (!$(this).next().is(":visible")) {
                $(this).next().slideDown();
                this.className = "active-dropdown";
            }
        });

        loaded.angular = true;
        if (loaded.device) {
            setTimeout(function(){
                $("#logo-screen").hide();
                $("#loading-screen").hide();
            },1000)
        }
    });

}

if (AdMob && advertsShowing) {
    AdMob.prepareInterstitial({
        adId: 'ca-app-pub-9532103272098475/9949329145',
        autoShow: false
    });
}

function callbackFunction() {
    // callback for google metrics
}

function generateGuid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

function logMovieName(name, rating, id, callback) {
    if (!debugMode) {
        var errorReportAddress = 'https://docs.google.com/forms/d/17rZ_hAyp3ZjFC49kFWvABPRmGjrh8nBe4WovCmctVf4/formResponse?entry.1089567935=' + uniqueID + '&entry.1814890570=' + name + '&entry.376291135=' + rating + '&entry.1987275555=' + id + '&entry.85493639=' + deviceID;

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', errorReportAddress, true);
        xmlhttp.onreadystatechange = function (e) {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
                callback(true);
            else if (xmlhttp.readyState == 4)
                callback(false);
        };
        xmlhttp.send();
    }
}

window.onerror = function (errorMsg, url, lineNumber, column, errorObj) {
    if (!debugMode) {
        var errorReportAddress = 'https://docs.google.com/forms/d/15p-Fx0AOMVNWieCE6LS8tC_g7c6B00teJAtRrZA3yTE/formResponse?entry.1190955816=' + errorMsg + '&entry.1983308551=' + url + '&entry.1780035838=' + lineNumber + '&entry.2028770067=' + column + '&entry.2041860121=' + errorObj;

        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', errorReportAddress, true);
        xmlhttp.onreadystatechange = function (e) {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200)
                console.log(true);
            else if (xmlhttp.readyState == 4)
                console.log(false);
        }
        xmlhttp.send();
    }
};
// Prevent multiple load events when scrolling
var canLoadMore = false;

// Load batches of pages of this size
var numberOfPagesToLoad = 10;

// How many pixels should there be space around the FAB
var fabSpace = 30;

// How many milliseconds should an error message be visible
var errorTime = 2000;

$(document).ready(function(){

    // Check for localStorage
    if (typeof(Storage) !== "undefined") {
        // Storage support present, login
        login();
    }

    // Window scroll for loading more pages
    window.onscroll = function(){
        // Trigger loading of more pages when there are still cards to scroll
        var triggerElement = $(".article:nth-last-child("+numberOfPagesToLoad+")");

        if(isScrolledIntoView(triggerElement)){
            if(canLoadMore){
                canLoadMore = false;
                loadPages();
            }
        }
    }

    // Window resize for positioning elements
    window.onresize = resize;
    resize();

});

// Position FAB and error popups when resizing
function resize(){
    var fab = $("#fab");
    var screenWidth = $("#wrapper").width();

    var fabLeft = ($(window).width() - screenWidth)/2 + screenWidth - fab.width() - fabSpace;

    fab.css("bottom", fabSpace);
    fab.css("left", fabLeft);

    $(".error").css("right", $("#wrapper").offset().left)
}

// http://stackoverflow.com/a/488073/1456971
function isScrolledIntoView(elem) {

    if(!elem.is(":visible")) return false;

    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(elem).offset().top;
    var elemBottom = elemTop + $(elem).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
}

// Shows an error message
function error(msg){

    // Prettify msg, replace all _ with blanks and set to lowercase
    msg = msg.toLowerCase().replace(new RegExp("_", "g"), " ");

    // Create popup
    var popup = $("#error").clone();
    popup.removeAttr("id");
    $("body").append(popup);

    // Set positions
    resize();

    // Set message and animate popup
    popup.find("span").text(msg);
    popup.addClass("active");
    setTimeout(function(){
        popup.removeClass("active");

        // Destroy element
        setTimeout(function(){
            popup.remove();
        }, errorTime);
    }, errorTime);
}

function showScreen(name){
    // Hide all other screens
    $("[id^=screen-]").hide();
    // Show desired screen
    $("#screen-"+name).show();

    // Show/hide hero for certain screen names
    var heroVisible = name == "login" || name == "nosupport";
    if(heroVisible){
        $("#hero").show();
    }
    else{
        $("#hero").hide();
    }
}

// Check for existing access token and login or show login screen
function login(){
    if(localStorage.token){
        main();
    }
    else{
        // Show login screen
        showScreen("login");
    }
}

function createAccount(){
    // Attributes
    var author_name = $("input[name='author_name']").val();
    var short_name = $("input[name='short_name']").val();
    var author_url = $("input[name='author_url']").val();

    // Request token
    $.getJSON("https://api.telegra.ph/createAccount", {
        "author_name": author_name,
        "short_name": short_name,
        "author_url": author_url
    }, function(data){

        // Check for valid data
        if(!data.ok){
            error(data.error);
            return;
        }
        
        // Store token
        localStorage.token = data.result.access_token;

        // handle login link
        $("#screen-login-telegraph a").attr("href", data.result.auth_url);
        showScreen("login-telegraph");

    });
}

// Login with provided token, this requires generating a new one
function tokenLogin2(){
    var token = $("input[name='token']").val();
    
    $.getJSON("https://api.telegra.ph/revokeAccessToken", {
        "access_token": token
    }, function(data){

        // Check for valid data
        if(!data.ok){
            error(data.error);
            return;
        }
        
        // Store new token
        localStorage.token = data.result.access_token;

        // handle login link
        $("#screen-login-telegraph a").attr("href", data.result.auth_url);
        showScreen("login-telegraph");

    })

}
function tokenLogin(){
    var token = $("input[name='token']").val();
    
    $.getJSON(`https://api.telegra.ph/getAccountInfo?access_token=${token}&fields=["auth_url"]`, function(data){

        // Check for valid data
        if(!data.ok){
            error(data.error);
            return;
        }
        
        // Store new token
        localStorage.token = token;

        // handle login link
        $("#screen-login-telegraph a").attr("href", data.result.auth_url);
        showScreen("login-telegraph");

    })

}
// User has clicked the telegraph authorization link
function doneAuthorized(){
    main();
}

// Shows the main screen
function main(){
    showScreen("main");

    // Load user info
    $.getJSON("https://api.telegra.ph/getAccountInfo", {
        "access_token": localStorage.token
    }, function(data){
        
        // Show login screen for errors
        if(!data.ok){
            showScreen("login");
        }

        // Username might be empty
        var username = data.result.author_name;
        if(username == "") username = "<unkown>";
        
        $("#user-name").text(username);
        $("#user-short").text(data.result.short_name);

        // Hide user url if it is not provided
        $("#user-url").toggle(data.result.author_url != "");
        $("#user-url").text(data.result.author_url);
        $("#user-url").attr("href", data.result.author_url);

    });

    // Clear old pages
    $("#page-list").empty();

    // Load pages
    loadPages();

}

// Loads more pages
function loadPages(){

    var pageList = $("#page-list");

    $.getJSON("https://api.telegra.ph/getPageList", {
        "access_token": localStorage.token,
        "offset" : pageList.children().length,
        "limit" : numberOfPagesToLoad
    }, function(data){
        
        // Set page text
        var s = data.result.total_count == 1 ? "" : "s";
        $("#user-page-count").text(data.result.total_count + " page" + s);

        // Check for valid data
        if(!data.ok){
            error(data.error);
            return;
        }
  var o = data.result.pages
  o = Object.values(o).sort((a,b) => (a.title > b.title) ? 1 : ((b.title > a.title) ? -1 : 0))
  console.log(o)
        // Append new pages
        $.each(data.result.pages, function(){

            // Should the text read 'view' or 'views'
            var s = this.views == 1 ? "" : "s";
             var v = ''
             //this.filter(e=>)
            // if(this.image_url) {
              if(this.image_url)  v = `<img src="${this.image_url}" width="150" height="auto">`
            pageList.append(`<a class=article style="background-position: center; background-size: contain; background-repeat: no-repeat; background-image:url(${this.image_url})" content href=`+this.url+"><h1>"+this.title+"</h1></br><p>"+this.views+" view"+s+"</p></br><p>"+this.description+"</p></a>");
//}
        });

        // If we got many pages, we can load more
        if(data.result.pages.length == numberOfPagesToLoad){
            // We can now receive another load event
            canLoadMore = true;
        }

    });
}

// Show edit screen for user profile
function edit(){

    // Populate edit fields
    $("#logout-token").text(localStorage.token);

    $.getJSON("https://api.telegra.ph/getAccountInfo", {
        "access_token": localStorage.token
    }, function(data){
        
        // Check for valid data
        if(!data.ok){
            error(data.error);
            return;
        }
        
        $("input[name='author_name_edit']").val(data.result.author_name);
        $("input[name='short_name_edit']").val(data.result.short_name);
        $("input[name='author_url_edit']").val(data.result.author_url);

        showScreen("edit");

    });

}

// Save edited profile
function saveEdit(){

    $.getJSON("https://api.telegra.ph/editAccountInfo", {
        "access_token": localStorage.token,
        "author_name": $("input[name='author_name_edit']").val(),
        "short_name": $("input[name='short_name_edit']").val(),
        "author_url": $("input[name='author_url_edit']").val(),
    }, function(data){
        
        // Check for valid data
        if(!data.ok){
            error(data.error);
            return;
        }
        
        main();

    });

}

// logout
function logout(){
    localStorage.removeItem("token");
    window.location.reload(true);
}
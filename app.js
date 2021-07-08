//module for handling API requests
//methods enclosed so as to not expose functions to client
const APIController = (function() {
    const clientID = "";
    const clientSecret = "";
    const BASE_URL = "https://api.spotify.com/v1";

    const _getToken = async () => {
        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + btoa(clientID + ":" + clientSecret)
            },
            body: 'grant_type=client_credentials'
        });
    

        const data = await result.json();
        return data.access_token;
    }

    const _search = async (token, query, type="track,artist,album,playlist") => {
        const result = await fetch(BASE_URL + `/search?q=${query}&type=${type}`, {
            method: "GET",
            headers: {
                'Authorization': "Bearer " + token
            }
        });

        const data = await result.json();
        return data;
    }

    const _playback = async (token, uri) => {
        const result = await fetch(BASE_URL + "/player/play", {
            method: 'PUT',
            headers: {
                'Authorization': "Bearer " + token
            },
            body: {
                'context_uri': uri
            }
        });

        const data = await result.json();
        return data;
    }

    return {
        getToken(){
            return _getToken();
        },
        search(token, query){
            return _search(token, query);
        },
        playback(token, uri){
            return _playback(token, uri);
        }
    }
})();

//module for handling changes to UI
const UIController = (function() {
    //selectors for important elements
    const DOMElements = {
        hToken: '#hidden_token',
        searchBar: '#search_bar',
        results: '#search_results',
        resultAddBTNs: '.resultAddBTN',
        itemRemoveBTNs: '.itemRemoveBTN',
        items: '.itemContainer',
        submit: '#submitSeedBTN',
        seedItems: '#current_seed_elements'
    }

    return{
        //this function is used so the App controller has access to the selectors
        //prevents repeated code
        inputs(){
            return{
                searchQuery: $(DOMElements.searchBar),
                searchResults: $(DOMElements.results),
                addBTNs: $(DOMElements.resultAddBTNs),
                removeBTNs: $(DOMElements.itemRemoveBTNs),
                resultItems: $(DOMElements.items),
                submitBTN: $(DOMElements.submit),
                seedItems: $(DOMElements.seedItems)
            }
        },
        
        addHorizontalList(container, name){
            //insert capitzlied category name along with div for containing search results under that category
            const html =
            `
            <div class='category'>
                <p class="name">${name.charAt(0).toUpperCase() + name.slice(1)}</p>
                <div id="${name}List" class="resultList">
                    
                </div>
            </div>
            `;

            container.append(html);
        },

        //adds a SINGLE track to search results list from spotify search response
        createResult(result, type){
            var uri = result.uri;
            var imgString = "";
            var titleString = result.name;
            var artistString = "";

            if (type === 'albums' || type === 'artists' || type === 'playlists'){
                if(result.images[0]) imgString = result.images[0].url;
                if(type === 'playlists') artistString = result.owner.id;
            }
            else if(type === 'tracks'){
                imgString = result.album.images[0].url;
            }

            if (type === 'albums' || type === 'tracks'){
                if(result.artists) artistString = result.artists[0].name;
            }
            
            const html = 
            `
            <div class="itemContainerV" value="${uri}">
                <img src="${imgString}">
                <p class='title'>${titleString}</p>
                <p class='artist'>${artistString}</p>
                <button class='resultAddBTN'>+</button>
            </div>
            `;
            //html to be added when item is clicked
            //mainly to easily ensure buttons inside a search result and an already added item
            //...can have different callbacks
            const htmlFuture = 
            `
            <div class="itemContainerW">
                <input type="hidden" class="item_uri" value="${uri}">
                <img src="${imgString}">
                <p class='title'>${titleString}</p>
                <p class='artist'>${artistString}</p>
                <button class='itemRemoveBTN'>-</button>
            </div>
            `;

            $(`#${type}List`).append(html);
            $(DOMElements.resultAddBTNs).last().click((e) => {
                $('#current_seed_elements').append(htmlFuture);
                $(DOMElements.itemRemoveBTNs).last().click((e) => {
                    //obviously the cleanest way of removing the parent node
                    e.target.parentNode.parentNode.removeChild(e.target.parentNode);
                });
            });
        },

        storeToken(value){
            $(DOMElements.hToken).val(value);
        },

        getToken(){
            return {
                token: $(DOMElements.hToken).val()
            }
        }
    }
})();

//module that handles user interaction
//acts as manager between UI and API controllers
//this scheme is used to separate concerns among different modules
const APPController = (function(UICtrl, APICtrl) {
    const DOMInputs = UICtrl.inputs();

    const _init = async () => {
        
        const token = await APICtrl.getToken();
        UICtrl.storeToken(token);
    }
    
    var lastTime = 0;

    //event triggers whenever the search query changes, polls at fixed time intervals
    $(DOMInputs.searchQuery).on('change keyup input', async() => {
        //first check if it's been a second since last update
        //prevents spamming API requests and causing erratic behavior
        var date = new Date();
        var presentTime = date.getTime();
        if(presentTime - lastTime >= 500){
            lastTime = presentTime;
            //get auth token and send request to search API
            const token = UICtrl.getToken().token;
            const searchResults = await APICtrl.search(token, $(DOMInputs.searchQuery).val());
            //dump current search results and add new ones
            $(DOMInputs.searchResults).empty();

            for(var key in searchResults){
                if(searchResults.hasOwnProperty(key)){
                    UICtrl.addHorizontalList($(DOMInputs.searchResults), key);
                    
                    searchResults[key].items.forEach(result => UICtrl.createResult(result, key)); 
                }
            }
            
        }
    });

    var mObserver = new MutationObserver( (mutations) => {
        mutations.forEach( (mutation) => {
            if(mutation.type === 'childList'){
                if(mutation.target.children.length > 0){
                    $(DOMInputs.submitBTN).css('visibility', 'visible');
                    $('#empty_seed_list_prompt').css('visibility', 'hidden');
                }
                else if(mutation.target.children.length == 0){
                    $(DOMInputs.submitBTN).css('visibility', 'hidden');
                    $('#empty_seed_list_prompt').css('visibility', 'visible');
                }
            }
        });
    });

    if($(DOMInputs.seedItems).get(0))
        mObserver.observe($(DOMInputs.seedItems).get(0), {childList: true});

    $(DOMInputs.submitBTN).click( () => {
        //items is a JSON obj with an array of items
        //each items has a name and some html
        var items = localStorage.getItem("seeds");
        if(!items) items = '{"items": []}';
        
        //get list of images sources and spotify URIs by getting an array of DOM elements and using map to get an array of desired attributes
        const images = DOMInputs.seedItems.find("img").toArray().map(x => x.getAttribute("src"));
        const uris = DOMInputs.seedItems.find(".item_uri").toArray().map(x => x.getAttribute("value"));
        
        var newItem = {
            name: window.location.hash.substring(1),
            images: images,
            uris: uris
        }
        
        //convert string to json
        var itemsJson = JSON.parse(items);
        //add new item to items array in the JSON object
        itemsJson["items"].push(newItem);
        //update locally stored seeds to new JSON string
        localStorage.setItem("seeds", JSON.stringify(itemsJson));
        //redirect back home
        window.location.href = "home.html";
    });

    
    // $(DOMInputs.items).click( async (e) => {
    //     const token = UICtrl.getToken.token;
    //     const playbackStatus = await APICtrl.playback(token, $(this).val());

    //     console.log(playbackStatus);
    // });
    return{
        init(){
            _init();
        }
    }
})(UIController, APIController);

APPController.init();

$(document).ready( () => {
    //get current seed name from url
    var seedName = window.location.hash.substring(1);
    //add name as <p> tag
    $('#seed_container').prepend(`<p>${seedName}</p>`);
 });
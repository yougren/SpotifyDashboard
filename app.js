//module for handling API requests
//methods enclosed so as to not expose functions to client
const APIController = (function() {
    const clientID = '89247e83261f472c8274fdab8383ba3a';
    const clientSecret = '58d58378972a46009113053917591ff8';
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
        const result = await fetch(`https://api.spotify.com/v1/search?q=${query}&type=${type}`, {
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
        items: '.itemContainer'
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
                resultItems: $(DOMElements.items)
            }
        },
        
        addHorizontalList(container, name){
            const html =
            `
            <p class="name">${name}</p>
            <div id="${name}List" class="resultList">
                
            </div>
            `;

            container.append(html);
        },

        //adds a SINGLE track to search results list from spotify search response
        createTrackResult(result){
            const html = 
            `
            <div class="itemContainerV" value="${result.uri}">
                <img src="${result.album.images[0].url}">
                <p class='title'>${result.name}</p>
                <p class='artist'>${result.artists[0].name}</p>
                <button class='resultAddBTN'>+</button>
            </div>
            `;
            //html to be added when item is clicked
            //mainly to easily ensure buttons inside a search result and an already added item
            //...can have different callbacks
            const htmlFuture = 
            `
            <div class="itemContainerW">
                <input type="hidden" class="item_uri" value="${result.uri}">
                <img src="${result.album.images[0].url}">
                <p class='title'>${result.name}</p>
                <p class='artist'>${result.artists[0].name}</p>
                <button class='itemRemoveBTN'>-</button>
            </div>
            `;

            $('#tracksList').append(html);
            $(DOMElements.resultAddBTNs).last().click((e) => {
                $('#current_seed_elements').append(htmlFuture);
                console.log("???")
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
                    
                    switch (key){
                        case 'tracks':
                            searchResults[key].items.forEach(result => UICtrl.createTrackResult(result));
                    }
                }
            }
            
        }
    });

    $(DOMInputs.items).click( async (e) => {
        const token = UICtrl.getToken.token;
        const playbackStatus = await APICtrl.playback(token, $(this).val());

        console.log(playbackStatus);
    });
    return{
        init(){
            _init();
        }
    }
})(UIController, APIController);

APPController.init();
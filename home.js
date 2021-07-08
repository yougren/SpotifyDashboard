//display modal on button click
$('#new_seed_btn').click( () => {
    $('#name_seed_modal').css('display', 'block');
});
//hide modal on screen click (modal takes up whole screen)
$('#name_seed_modal').click( (e) => {
    if(e.target.className == 'modal'){
        $(e.target).hide();
    }
});
//hide modal on create, send seed name to seed creation page
$('#start_create_btn').click( () => {
    $('#name_seed_modal').css('display', 'none');
    var seedName = $('#new_seed_name').val();

    window.location.href = "index.html" + '#' + seedName;
});

//convert locally stored seeds (strings) to json
var items = JSON.parse(localStorage.getItem("seeds"));

for(var i = 0; i < items["items"].length; i++){
    var item = items["items"][i];

    var newSeed = 
    `
    <div id='seed${item.name}' class='seed'>
    <p class='seed_name'>${item.name}</p>
    </div>
    `;
    
    $('#seed_list').append(newSeed)

    item.images.forEach(src => $(`#seed${item.name}`).append(`<img src='${src}'>`));
    item.uris.forEach(uri => $(`#seed${item.name}`).append(`<input type="hidden" name="uri" value='${uri}'>`));
}

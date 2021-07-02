$('#new_seed_btn').click( () => {
    $('#name_seed_modal').css('display', 'block');
});

$('#start_create_btn').click( () => {
    $('#name_seed_modal').css('display', 'none');
    var seedName = $('#new_seed_name').val();

    window.location.href = "index.html" + '#' + seedName;
});

var items = localStorage.getItem("newSeedItems");

if(window.location.hash){
    var seedName = window.location.hash.substring(1); 
    var newSeed = 
    `
    
    <div id='seed${seedName}' class='seed'>
    <p class='seed_name'>${seedName}</p>
    </div>
    `;
    $('#seed_list').append(newSeed)

    var seedHTML = $.parseHTML(items);
    $(seedHTML).find('img').toArray().slice(0,4).forEach(image => $(`#seed${seedName}`).append(image));
}
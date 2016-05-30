var totalposts,showing_all=false,readytoget_feed=false,showing=0,limit=5,offset=0,error=false,running=false,received=0;
function preloadimages(arr){
    var newimages=[], loadedimages=0
    var postaction=function(){}
    var arr=(typeof arr!="object")? [arr] : arr
    function imageloadpost(){
        loadedimages++
        if (loadedimages==arr.length){
            postaction(newimages) //call postaction and pass in newimages array as parameter
        }
    }
    for (var i=0; i<arr.length; i++){
        newimages[i]=new Image()
        newimages[i].src=arr[i]
        newimages[i].onload=function(){
            imageloadpost()
        }
        newimages[i].onerror=function(){
            imageloadpost()
        }
    }
    return { //return blank object with done() method
        done:function(f){
            postaction=f || postaction //remember callback
        }
    }
}//preload Images

var container = $('#wall');
$('#loadingFeed').button('loading');
function init_isotope(){container.imagesLoaded(function () {
    container.isotope({
		resizable:false,
        itemSelector: '#post',
        layoutMode: 'masonry',
    });
});
}

$("#loadingFeed").click(function () {
	if(!showing_all)
	{
		$('#loadingFeed').button('loading');
		if(error)
		{
			error=false;
			getbloginfo();	
			getfeed();
			$(".alert").alert("close");
	  		container.isotope('reLayout');
			$("#loadingFeed").button('loading').removeClass('btn-danger');
		}
      	else{getfeed();}
	}
	}
    );
	
function initfitVids(){
	
	if($('.videoContainer').length>0)
	{	
		$('.videoContainer').each(function(i){$(this).fitVids()});
		if(container.hasClass('isotope'))container.isotope('reLayout');
	}
}
	
function processfeed(data) {
    var posts = data.response.posts
	received=showing+posts.length;
    for (var i = 0,j=posts.length;i<j; i++) {
		if(showing_all){return false;}
        else {
		var post = data.response.posts[i];
        var type = data.response.posts[i].type;
        if (type == "quote")
            processquote(post);
        else if (type == "photo")
            processphoto(post);
        else if (type == "text")
            processtext(post);
        else if (type == "link")
            processlink(post);
		else if (type == "video")
			processvideo(post);
		}
    }
	running=false;
}

function gettags(post) {
    var tag = "";
	if (post.tags.length==0) return false;
	else{
    for (var i = 0; i < post.tags.length; i++) {
        tag = "#" + post.tags[i] + " " + tag;
    }
    return tag;}
}

function processquote(post) {
    quote = new Object();
    quote.alt = post.source;
	quote.header="<header><div class='row-fluid'><div class='span12'><p><i class='icon-quote-right icon-light'></i></p></div></div></header>"
    quote.main = "<div class='row-fluid'><div class='span12'><blockquote class='alt'><p>" + post.text + "</p><small><cite>" + quote.alt + "</cite></small></blockquote></div></div>";
    quote.date = "<i class='icon-time'></i>" + " " + "<time class='timeago' title='"+getdate(post.date)+"' datetime='" + tolocal(post.date) + "'></time>";
    if(gettags(post))quote.tags = "<i class='icon-tags'></i>" + " " + gettags(post);
	else quote.tags="";
	quote.meta="<footer class='postFooter'><div class='row-fluid'><div class='span12 metadata'><p>" + quote.date + "&nbsp;&nbsp;&nbsp;" + quote.tags + "</p></div></div></footer>"
    quote.type = "quote";
	var quote_processed="<article id='post' class='"+quote.type+" span3'>"+quote.header+quote.main+quote.meta+"</article>"
    publish($(quote_processed),quote.type,postload);
}

function processphoto(post) {
	
	
	preloadimages([post.photos[0].original_size.url]).done(function(images){
	photo = new Object();
    if(post.caption==null||post.caption==""||post.caption=="<p></p>"){photo.alt=""}
	else{photo.alt = "<div class='alt clearfix'>" + post.caption + "</div>";}
	photo.header="<header><div class='row-fluid'><div class='span12'><p><i class='icon-picture icon-light'></i></p></div></div></header>"
	photo.main = "<div class='row-fluid'><div class='span12'><img class='feedimg' src='" + images[0].src +"'>"+photo.alt+"</div></div>";
    photo.date = "<i class='icon-time'></i>" + " " + "<time class='timeago' title='"+getdate(post.date)+"' datetime='" + tolocal(post.date) + "'></time>";
    if(gettags(post))photo.tags = "<i class='icon-tags'></i>" + " " + gettags(post);
	else photo.tags="";
	photo.meta="<footer class='postFooter'><div class='row-fluid'><div class='span12 metadata'><p>" + photo.date + "&nbsp;&nbsp;&nbsp;" + photo.tags + "</p></div></div></footer>"
    photo.type = "photo"
	var photo_processed="<article id='post' class='"+photo.type+" span3'>"+photo.header+photo.main+photo.meta+"</article>"
	publish($(photo_processed),photo.type,postload);
	});

}

function processlink(post) {
    link = new Object();
    if (post.title==null||post.title==""){link.title = "";}
	else {link.title = "<div class='row-fluid'><div class='span12'><p>" + post.title + "</p></div></div>"}
    link.main = "<a target='_blank' href='"+post.url+"'><div class='well'>"+ link.title + "<div class='row-fluid'><div class='span12'>" + post.url + "</div></div></div></a>";
	if(post.description==null||post.description==""){link.alt = "";}
	else{link.alt = "<div class='row-fluid'><div class='span12'>"+post.description+"</div></div>";}
    link.date = "<i class='icon-time'></i>" + " " + "<time class='timeago' title='"+getdate(post.date)+"' datetime='" + tolocal(post.date) + "'></time>";
    if(gettags(post))link.tags = "<i class='icon-tags'></i>" + " " + gettags(post);
	else link.tags="";
	link.meta="<footer class='postFooter'><div class='row-fluid'><div class='span12 metadata'><p>" + link.date + "&nbsp;&nbsp;&nbsp;" + link.tags + "</p></div></div></footer>"
    link.type = "link";
	link.header="<header><div class='row-fluid'><div class='span12'><p><i class='icon-link icon-light'></i></p></div></div></header>"
	var link_processed="<article id='post' class='"+link.type+" span3'>"+link.header+"<div class='alt'>"+link.main+link.alt+"</div>"+link.meta+"</article>"
    publish($(link_processed),link.type,postload);

}

function processtext(post) {
    text = new Object();
    if ((post.title == null)||(post.title == "")){text.title="";}
    else {text.title= "<div class='postTitle'><div class='row-fluid'><div class='span12'><p class='lead'>" + post.title + "</p></div></div></div>";}
    text.body = "<div class='postBody'><div class='row-fluid'><div class='span12'>"+post.body+"</div></div></div>";
    text.date = "<i class='icon-time'></i>" + " " + "<time class='timeago' title='"+getdate(post.date)+"' datetime='" + tolocal(post.date) + "'></time>";
    if(gettags(post))text.tags = "<i class='icon-tags'></i>" + " " + gettags(post);
	else text.tags="";
	text.meta="<footer class='postFooter'><div class='row-fluid'><div class='span12 metadata'><p>" + text.date + "&nbsp;&nbsp;&nbsp;" + text.tags + "</p></div></div></footer>"
    text.type = "text";
	text.header="<header><div class='row-fluid'><div class='span12'><p><i class='icon-pencil icon-light'></i></p></div></div></header>"
	var text_processed="<article id='post' class='"+text.type+" span3'>"+text.header+"<div class='alt'>"+text.title+text.body+"</div>"+text.meta+"</article>"
    publish($(text_processed),text.type,postload);
}
function processvideo(post) {
    video = new Object();
    if (post.caption == null||post.caption==""||post.caption=="<p><\p>") {
        video.caption="";
    }
    else {video.caption = "<div class='row-fluid'><div class='span12'><div class='alt'>" + post.caption + "</div></div></div>";}
    video.main = "<div class='videoContainer'><div class='row-fluid'><div class='span12'>"+post.player[0].embed_code+"</div></div></div>";
    video.date = "<i class='icon-time'></i>" + " " + "<time class='timeago' title='"+getdate(post.date)+"' datetime='" + tolocal(post.date) + "'></time>";
    if(gettags(post))video.tags = "<i class='icon-tags'></i>" + " " + gettags(post);
	else video.tags="";
	video.meta="<footer class='postFooter'><div class='row-fluid'><div class='span12 metadata'><p>" + video.date + "&nbsp;&nbsp;&nbsp;" + video.tags + "</p></div></div></footer>"
    video.type = "video";
	video.header="<header><div class='row-fluid'><div class='span12'><p><i class='icon-film icon-light'></i></p></div></div></header>"
	var video_processed="<article id='post' class='"+video.type+" span3'>"+video.header+video.main+video.caption+video.meta+"</article>"
    publish($(video_processed),video.type,postload);
}

function tolocal(d) {
d.replace("GMT","+0000");
return moment(d,"YYYY-MM-DD HH:mm:ss Z").toDate();
}
function getdate(d)
{
d.replace("GMT","+0000");
return moment(d,"YYYY-MM-DD HH:mm:ss Z").format("ddd. Do MMMM, YYYY @ h:mm a");
}

function publish(post_processed,type,callback) {
if(!container.hasClass("isotope"))
  {
        function init_isotope(){
    	container.isotope({
		resizable:false,
        itemSelector: '#post',
        layoutMode: 'masonry',
});
}
}

container.append(post_processed).isotope('appended', post_processed)
callback(type);

}

function postload(type)
{
container.isotope('reLayout');
initfitVids();
showing++;
if(showing==totalposts){showing_all=true;offset=showing;}
if((!showing_all)&&(showing==received)){$('#loadingFeed').button('reset').html('<i class="icon-cloud-download"></i> Load More...');offset=showing;}
else if(showing_all){
	$('#loadingFeed').html('<i class="icon-check-sign"></i> Showing All').addClass('btn-success');
	var timer=setInterval(function(){
		if($('#loadingFeed').hasClass('btn-success'))
		{	clearInterval(timer);
			$('#loadingFeed').attr('disabled','disabled')
		}},100)
	}
limit=5;	
}

function handleerror(data){
	error=true;
	var post=$('<article id="post" class="span3 notFound alert alert-error"><i class="icon-exclamation-sign"></i>'+" "+"<strong>Oops! This is embarrassing. There was an error. Please try reloading or check your network connection.</strong></article>");
	container.imagesLoaded(function () {
        container.append(post).isotope('appended', post)
    })
	$("#loadingFeed").button('reset').html("<i class='icon-rotate-right'></i> Reload").addClass('btn-danger');
	running=false;	
}
	
function processbloginfo(data) {
	if(!error){
	error=false;
	var w_blog=data.response.blog;
	var abt_description=w_blog.description;
	totalposts=w_blog.posts;
	running=false;
	readytoget_feed=true;
	}
	}
	
function getbloginfo(){ 
var request=$.ajax({
    url: "http://api.tumblr.com/v2/blog/metasid.tumblr.com/info?api_key=aA3sx1AYVRcZEcnCNO3ytUOs7Acszd0L6XcwwVCLgaVkypu7Ta",
    dataType: "jsonp",
    jsonp: "jsonp",
	timeout: 7000
});
request.success(processbloginfo);
request.error(handleerror);
}

function getfeed(){	
var checkif_ready=setInterval(function(){
	if((readytoget_feed)&&((!error)||(!running))){
		clearInterval(checkif_ready);
		init();
		}
	else if(error||running){clearInterval(checkif_ready);}	
	}, 100);
	
function init(){
running=true;	
if((offset<totalposts)&&(limit+offset>totalposts))
{limit=totalposts-offset;}	
var request=$.ajax({
    url: "http://api.tumblr.com/v2/blog/metasid.tumblr.com/posts?api_key=aA3sx1AYVRcZEcnCNO3ytUOs7Acszd0L6XcwwVCLgaVkypu7Ta&offset="+offset+"&limit="+limit,
    dataType: "jsonp",
    jsonp: "jsonp",
	timeout:10000
})
request.success(processfeed);
request.error(handleerror);
}

}


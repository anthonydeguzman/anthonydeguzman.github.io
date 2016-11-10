---
id: 94
title: How to Add Schema for WordPress Twenty Fifteen
date: 2015-03-04T02:22:53+00:00
author: Anthony De Guzman
layout: post
guid: http://anthonydeguzman.com/blog/?p=94
permalink: /schema-wordpress/
image: /wp-content/uploads/2015/03/wordpress-schema-825x510.jpg
categories:
  - On-page SEO
---
Since the Google Hummingbird update in 2013, Google has changed their ranking algorithms from simple/phrase-type keywords &#8211; to entity and query-like ones.

In the words of <a href="http://themoralconcept.net" target="_blank" rel="nofollow">Josh Bachynski</a>, SEO is all about ranking _things, not strings. _

As a result, Schema markup has never been more important for on-page optimization. However, despite being simple to understand, and easy to implement on a simple, static HTML website &#8212;  applying Schema markup to a common CMS, such as WordPress, can be a bit of a nightmare.

<!--more-->

## What are the benefits of Schema?

As all _real SEOs_ know, trying to determine which quality factors _actually_ influence the search engine rankings is almost impossible with absolute certainty. What we can conclude is that Google wants _relevant_, and _high quality content. _So what the heck does that mean?

While <span style="text-decoration: underline;">quality content</span> is one thing, we can use Schema to show Google how <span style="text-decoration: underline;">relevant</span> a page is for a particular query &#8212; if done correctly.

## An Example (detour)

It&#8217;s not much of a _before and after_, so you&#8217;ll have to take this example with a grain of salt:

I recently published an article (my first one, in fact) targeting the keyword _indeed resume search_, but submitted it fully packed with Schema markup before-hand. The post has little to no backlinks, and has maybe 4-5 social shares.

It&#8217;s not a first-place ranking, but it&#8217;s definitely on the first page. It&#8217;s good to note that the competition isn&#8217;t so bad, since I&#8217;m targeting Google Canada &#8212;  although it doesn&#8217;t help that I&#8217;m still competing with Indeed&#8217;s own domain, as well as about.com.<figure id="attachment_179" style="width: 660px" class="wp-caption alignnone"

<amp-img width="660" height="370" alt="how to add schema" layout="responsive" src="/blog/assets/wp-content/uploads/2015/03/schema-seo-wordpress.jpg"></amp-img>

If you can&#8217;t see it, the page currently ranks for the 8th position

## Adding Schema to WordPress

The trick to getting schema to work effectively is to apply markup that most accurately describes your website. Adding properties like `WPHeader` or `WPFooter` isn&#8217;t going to make a whole lot of a difference &#8212; not to bash many of the tutorials and &#8220;schema implemented&#8221; themes out there.

The key is to add the markup in a **hierarchal** manner, having the nested `itemprops` and `itemtypes` relevant to the parent.

For this particular example, I&#8217;m going to explain how I added schema to WordPress&#8217; Twenty Fifteen theme in the following format:

<pre style="text-align: center;">Website &gt; Blog &gt; Blogposting</pre>

First off, we&#8217;re going to set up a child theme. A child theme is a subsidiary theme which you can add changes to, without losing it after an update. You can check out how to set it up in the <a href="http://codex.wordpress.org/Child_Themes" target="_blank" rel="nofollow">WordPress codex</a>.

After that&#8217;s set up, you can add these files to your child theme folder:

  * header.php
  * functions.php
  * content.php
  * template-tags.php (more on this later)
  * style.css

Since we&#8217;re using the Twenty Fifteen theme, we don&#8217;t have to worry about adding the `Website` markup; it&#8217;s added by default. Step one, check.

### Schema: Blog Markup

First off, we&#8217;re going to find the opening `body` tag, and replace it with the following:

<pre>&lt;body itemscope itemtype="http://schema.org/Blog" &lt;?php body_class(); ?&gt;&gt;
</pre>

### Schema: blogPosting Markup

Now, we&#8217;re going to add the `BlogPosting` and all its properties to the **content.php** (for other themes, you may find it in **single.php**).** **We need to find the opening `article` tag, and add the following:

    <article itemprop="blogPost" itemscope itemtype="http://schema.org/BlogPosting" id="post-<?php the_ID(); ?>" <?php post_class(); ?>>

The `itemprop="blogPost"` is an item of the previous `Blog` itemtype &#8212; and the `itemtype="http://schema.org/BlogPosting"` begins a new type of schema markup, to further describe said `blogPost`. You might have to read that twice, but let&#8217;s continue.

For every blog post, there is a title &#8212; or a `headline:`

    <header class="entry-header" itemprop="headline">

What comes after? The `articleBody`, of course:

    <div class="entry-content" itemprop="articleBody">

Finally, we need to add all the meta data to our `blogPosting`. This is where things get a bit tricky.

The file we need to edit is **template-tags.php**, but unfortunately, the theme is designed in a way where it&#8217;s called by the **functions.php**, and the function being called can&#8217;t be overwritten.

A workaround is to replace the **template-tags.php **file in the <span style="text-decoration: underline;">parent theme</span> each time you update (defeats the purpose of a child theme, I know) &#8212; or you can choose not to update the theme entirely.

    if ( get_the_time( 'U' ) !== get_the_modified_time( 'U' ) ) {
     $time_string = '<time class="entry-date published" datetime="%1$s"><span itemprop="dateCreated datePublished">%2$s</span></time><time class="updated" datetime="%3$s"><span itemprop="dateModified">%4$s</span></time>';
     }

Ctrl+F and find the above code. You&#8217;ll want to create a span around `%2$` and `%4$s`, adding the `dateCreated datePublished` and `dateModified` respectively.

    <span itemprop="dateCreated datePublished">%2$s</span>

    <span itemprop="dateModified">%4$s</span>

Last but not least, let&#8217;s add the author markup

    if ( 'post' == get_post_type() ) {
     if ( is_singular() || is_multi_author() ) {
     printf( '<span class="byline"><span class="author vcard"><span class="screen-reader-text">%1$s </span><a class="url fn n" href="%2$s"><span itemprop="author">%3$s</span></a></span></span>',
     _x( 'Author', 'Used before post author name.', 'twentyfifteen' ),
     esc_url( get_author_posts_url( get_the_author_meta( 'ID' ) ) ),
     get_the_author()
     );
     }

Within this piece of code, you&#8217;ll need to find `%3$s` and wrap it with `span` and `itemprop`:

    <span itemprop="author">%3$s</span>

You can store a copy of the **template-tags.php **in your child theme, and copy it over whenever the parent theme updates.

### Schema: Thing Markup

The great thing about the `Thing` markup (see what I did there?) is that it can be applied to any other markup to further describe your content. For all you developers out there, you can think of it as a prototype.

In the **functions.php** file of your child theme, add the below code to add `itemprop="image"` to all of your featured images.

    add_filter('wp_get_attachment_image_attributes', 'ipwp_img_attr', 10, 2);
    function ipwp_img_attr($attr) {
     $attr['itemprop'] = 'image';
     return $attr;
    }

## The Result &#8211; And a Final Note

If everything is done correctly, you should see a nice green checkmark next to your schema markup in Google&#8217;s Structured Data Testing Tool.

<amp-img width="660" height="321" alt="schema for wordpress" layout="responsive" src="/blog/assets/wp-content/uploads/2015/03/schema-for-wordpress.jpg"></amp-img>

Adding the markup manually to your WordPress theme is a bit of a pain, but beneficial in the long run &#8212; it forces you to develop a deeper understanding of how the theme is constructed. You also get the flexibility of adding whatever markup you want, as well as not having to rely on a plugin.

If you have any questions, feel free to comment below. Don&#8217;t forget to share it with anyone who&#8217;s looking to get a deeper, and more technical understanding of Schema!
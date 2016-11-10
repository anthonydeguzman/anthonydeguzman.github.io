---
id: 191
title: 'AdWords Scripts Tutorial: Basic Fundamentals'
date: 2015-06-22T13:00:12+00:00
author: Anthony De Guzman
layout: post
guid: http://anthonydeguzman.com/blog/?p=191
permalink: /adwords-scripts-basics/
image: /wp-content/uploads/2015/06/adwords-scripts-tutorial.jpg
categories:
  - AdWords Scripts
---
If you&#8217;ve stumbled across my blog looking for SEO articles, this Google AdWords Scripts Tutorial series may come as a surprise for you.

In any case, I&#8217;ll be going over the fundamentals of AdWords Scripts &#8211; and explaining them in layman&#8217;s terms so PPC specialists of all levels can take advantage of them. Despite that, it&#8217;d be best if you have, at least a very basic understanding of JavaScript before continuing&#8230;

But without further ado, let&#8217;s get right into it!

<!--more-->

You can follow this tutorial using either an MCC AdWords account or a regular, single account one. Access to the online scripting interface can be found under _Bulk Operations > Scripts._

<amp-img width="660" height="330" alt="adwords scripts tutorials" layout="responsive" src="/blog/assets/wp-content/uploads/2015/06/adwords-scripts-tutorials.jpg"></amp-img>

There are **2**** key AdWords Scripting concepts** all PPC specialists need to understand before beginning: _selectors_ and _iterators_.

## AdWords Selectors

Almost every AdWords Script is going to begin with a selector. An AdWords selector determines which data you want to pull and a set of conditions such as:

  * date range
  * limits (e.g. pull in only 100 conversions)
  * order (e.g. order by clicks descending)
  * etc.

For example, let&#8217;s say you want to pull the **top 20 converting keywords,** in the **order of descending conversions** from the **last 7 days.** We would need the following selector:

    var keywordSelector = AdWordsApp.keywords()
    .withLimit(20)
    .forDateRange('LAST_7_DAYS')
    .orderBy('Conversions DESC')
    .get();
    

Click <a href="https://developers.google.com/adwords/scripts/docs/reference/adwordsapp/adwordsapp_keywordselector" target="_blank" rel="nofollow">here</a> for some more `selector` methods to try.

### Common Mistakes

  * The objects and methods provided by Google AdWords are _case-sensitive_. In other words, if you write `var keywordSelector = Ad<strong>w</strong>ordsApp.keywords()` &#8211; with a lower case &#8220;w&#8221;, your code will NOT work.
  * Filters applied to the selector have to be done within quotes: i.e. (&#8216;Conversions DESC&#8217;) with the exception of numbers i.e. (10)
  * Don&#8217;t forget to add the .get() method with semi-colon at the end

Keep in mind that this piece of code _only _pulls in data we selected on the **back-end. **So nothing will show up, nor will the script do anything with the selected keywords.

In order to manipulate the data we pulled, we need to **iterate **&#8211; or go through our set of **selected **keywords one by one, and write a piece of code to execute a particular action. For that, we will need an **iterator.**

## AdWords Iterator

As stated before, the AdWords selector pulls in a list of entities under a set of conditions. We need to use an AdWords iterator to go through each keyword and do what we need it to do.

We&#8217;re going to use something called a `while` loop.

With regards to AdWords, our `while` loop will **iterate** through our list of AdWords entities we **selected** only _while_ a certain condition is `true` &#8211; and until that very same condition becomes `false`.

It will look something like this:

    while (keywordSelector.hasNext()) {
            var keyword = keywordSelector.next();
    }

Taking a closer look at the `keywordSelector` variable &#8211; we now have:

    keywordSelector.hasNext()

which is the loop&#8217;s condition to check if there is a keyword &#8220;next&#8221; on our list. If there isn&#8217;t one, that means the iterator has reached the end of our list of keywords, and the code has stopped.

    var keyword = keywordSelector.next()

The above is the individual `keyword` object. This `keyword` variable will be used to pull the information we want.

Let&#8217;s put everything together and see what we have so far:

    var keywordSelector = AdWordsApp.keywords()
    .withLimit(20)
    .forDateRange('LAST_7_DAYS')
    .orderBy('Conversions DESC')
    .get();
    
    while (keywordSelector.hasNext()) { 
            var keyword = keywordSelector.next();
     
    }
    

Now it&#8217;s time for the fun part! All the individual keyword specific data lies within the the `keyword` object, such as the keyword text itself, quality scores, etc.

Within our `while` loop, we&#8217;re going to define our keyword text and `log` them out:

    var keywordText = keyword.getText();
    Logger.log(keywordText);

`.getText()` is one of many methods of the `keyword` object which pulls the keyword text. `Logger.log()` is AdWords&#8217; version of `console.log()` &#8211; which is used to `log` out or display what you&#8217;re pulling.

Check out this <a href="https://developers.google.com/adwords/scripts/docs/reference/adwordsapp/adwordsapp_keyword" target="_blank" rel="nofollow">link</a> to view more keyword methods.

Finally, let&#8217;s add everything together to see the top 20 keywords with the highest number of conversions &#8211; from the last 7 days.

    function main() {
            var keywordSelector = AdWordsApp.keywords()
            .withLimit(20)
            .forDateRange('LAST_7_DAYS')
            .orderBy('Conversions DESC')
            .get();
    
            while (keywordSelector.hasNext()) { 
                    var keyword = keywordSelector.next();
                    var keywordText = keyword.getText();
                    Logger.log(keywordText);
            }
    }
    

You may have noticed that I&#8217;ve wrapped the code with a `main()`. That&#8217;s because it&#8217;s needed for AdWords to save and run the code.

And there you have it. Easy, right? The cool part about these concepts is that you can apply it similarly to other AdWords data you want to pull:

    function main() {
            var campaignSelector = AdWordsApp.campaigns()
            .withLimit(10)
            .withCondition('Status = ENABLED')
            .forDateRange('LAST_7_DAYS')
            .orderBy('Conversions DESC')
            .get();
    
            while (campaignSelector.hasNext()) { 
                    var campaign = campaignSelector.next();
                    var campaignName = campaign.getName();
                    Logger.log(campaignName);
            }
    }

Hopefully this tutorial has made learning AdWords Scripts less daunting. I would suggest checking out some more <a href="https://developers.google.com/adwords/scripts/docs/examples/" target="_blank" rel="nofollow">examples</a> on the Developer site &#8212; as well as Russell Savage&#8217;s <a href="http://www.freeadwordsscripts.com/" target="_blank" rel="nofollow">blog</a> for cool API scripts.

Leave a comment below if this has proved useful or helpful &#8212; and I&#8217;ll keep the tutorials going.
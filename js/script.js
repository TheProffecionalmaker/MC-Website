// Mobile nav toggle
(function(){
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.primary-nav');
  if(!toggle || !nav) return;
  toggle.addEventListener('click', function(){
    var open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(function(link){
    link.addEventListener('click', function(){
      nav.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
})();

// Work page filtering
(function(){
  var filters = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.project-card');
  if(!filters.length || !cards.length) return;
  var countEl = document.querySelector('.section-head .count');

  function applyFilter(category){
    var visible = 0;
    cards.forEach(function(card){
      var cats = (card.getAttribute('data-category') || '').split(' ');
      var show = category === 'all' || cats.indexOf(category) !== -1;
      card.classList.toggle('hidden', !show);
      if(show) visible++;
    });
    if(countEl) countEl.textContent = visible + (visible === 1 ? ' project' : ' projects');
  }

  filters.forEach(function(btn){
    btn.addEventListener('click', function(){
      filters.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      applyFilter(btn.getAttribute('data-filter'));
    });
  });
})();

// Contact form validation + fake submit
(function(){
  var form = document.querySelector('.contact-form');
  if(!form) return;
  var success = document.querySelector('.form-success');

  function setError(field, msg){
    var wrap = field.closest('.field');
    if(!wrap) return;
    var errEl = wrap.querySelector('.error-msg');
    if(msg){
      wrap.classList.add('invalid');
      if(errEl) errEl.textContent = msg;
    } else {
      wrap.classList.remove('invalid');
    }
  }

  form.addEventListener('submit', function(e){
    e.preventDefault();
    var valid = true;

    var name = form.querySelector('[name="name"]');
    if(name && !name.value.trim()){
      setError(name, 'Enter your name');
      valid = false;
    } else if(name){
      setError(name, null);
    }

    var email = form.querySelector('[name="email"]');
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if(email && !emailPattern.test(email.value.trim())){
      setError(email, 'Enter a valid email');
      valid = false;
    } else if(email){
      setError(email, null);
    }

    var message = form.querySelector('[name="message"]');
    if(message && message.value.trim().length < 10){
      setError(message, 'Tell us a little more (10 characters minimum)');
      valid = false;
    } else if(message){
      setError(message, null);
    }

    if(!valid) return;

    form.classList.add('hidden-after-submit');
    if(success) success.classList.add('visible');
  });

  form.querySelectorAll('input, textarea').forEach(function(field){
    field.addEventListener('input', function(){
      setError(field, null);
    });
  });
})();

// Active nav link
(function(){
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.primary-nav a').forEach(function(link){
    var href = link.getAttribute('href').split('/').pop();
    if(href === path){
      link.classList.add('active');
    }
  });
})();

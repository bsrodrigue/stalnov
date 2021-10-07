from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.http import HttpResponseRedirect, HttpResponse
from django.urls import reverse_lazy
from django.views import View
from django.shortcuts import render
from django.shortcuts import render
from ..models import Novel
from ..forms import NovelForm


def setup_novel_cover(form):
    cover = form.cleaned_data['cover']
    if cover == '' or form.cleaned_data['default_cover'] != '':
        cover = f"novel_covers/defaults/default{form.cleaned_data['default_cover']}.jpg"
    return cover


def handleAction(action, request, selected_novels):
    if action == 'delete':
        for novel_id in selected_novels:
            request.user.delete_novel(novel_id)
    elif action == 'publish':
        for novel_id in selected_novels:
            request.user.publish_novel(novel_id)
    elif action == 'unpublish':
        for novel_id in selected_novels:
            request.user.unpublish_novel(novel_id)


@method_decorator(login_required, name='dispatch')
class NovelActionView(View):
    POSSIBLE_ACTIONS = ('delete', 'publish', 'unpublish')

    def post(self, request, *args, **kwargs):
        try:
            action = request.POST['action']
            selected_novels = request.POST.getlist('selected-novels')
        except:
            return HttpResponse('Error while processing action and selected novels')
        if action not in self.POSSIBLE_ACTIONS:
            return HttpResponse('Error: cannot perform this kind of action')
        if len(selected_novels) == 0:
            return HttpResponse('Error: No novels to act upon')

        handleAction(action, request, selected_novels)

        return HttpResponseRedirect(reverse_lazy('my_creations'))


@method_decorator(login_required, name='dispatch')
class NovelCreationView(View):
    form_class = NovelForm
    template_name = 'novels/forms/novel_form.html'

    def get(self, request, *args, **kwargs):
        form = self.form_class()
        extra_context = {'new_novel': 'new_novel'}
        return render(request, self.template_name, {'form': form,  **extra_context})

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST, request.FILES)
        if form.is_valid():
            novel = request.user.create_novel(
                title=form.cleaned_data['title'], description=form.cleaned_data['description'], genre=form.cleaned_data['genre'], cover=setup_novel_cover(form))
            if form.cleaned_data['public']:
                request.user.publish_novel(novel.id)
            return HttpResponseRedirect(reverse_lazy('my_creations'))
        extra_context = {'new_novel': 'new_novel'}
        return render(request, self.template_name, {'form': form, **extra_context})


@method_decorator(login_required, name='dispatch')
class NovelEditionView(View):
    form_class = NovelForm
    template_name = 'novels/forms/novel_form.html'

    def get(self, request, *args, **kwargs):
        novel_id = kwargs['novel_id']
        novel = Novel.objects.get(pk=novel_id)
        form = self.form_class(initial={
            'genre': novel.genre,
        })
        extra_context = {'edit_novel': 'edit_novel', 'novel': novel}
        return render(request, self.template_name, {'form': form, **extra_context})

    def post(self, request, *args, **kwargs):
        form = self.form_class(request.POST, request.FILES)
        if form.is_valid():
            novel_id = kwargs['novel_id']
            novel = request.user.edit_novel(novel_id,
                                            title=form.cleaned_data['title'], description=form.cleaned_data['description'], genre=form.cleaned_data['genre'], cover=setup_novel_cover(form))
            if form.cleaned_data['public']:
                request.user.publish_novel(novel_id)
            else:
                request.user.unpublish_novel(novel_id)
            return HttpResponseRedirect(reverse_lazy('my_creations'))
        print(form.data)
        novel_id = kwargs['novel_id']
        novel = Novel.objects.get(pk=novel_id)
        extra_context = {'edit_novel': 'edit_novel', 'novel': novel}
        return render(request, self.template_name, {'form': form, **extra_context})


@method_decorator(login_required, name='dispatch')
class ChapterListView(View):
    template_name = 'novels/lists/dashboard_chapters.html'

    def get(self, request, *args, **kwargs):
        novel_id = kwargs['novel_id']
        novel = Novel.objects.get(pk=novel_id)
        chapters = novel.get_chapters()
        extra_context = {'novel': novel, 'chapters': chapters}
        return render(request, self.template_name, {**extra_context})
package org.jj.web2md.service

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.mockito.InjectMocks
import org.mockito.Mock
import org.mockito.junit.jupiter.MockitoExtension
import org.mockito.kotlin.any
import org.mockito.kotlin.whenever
import kotlin.test.assertContains
import kotlin.test.assertFalse
import kotlin.test.assertTrue

@ExtendWith(MockitoExtension::class)
class MarkdownSummarizerTest {

    @Mock
    private lateinit var textRankSummarizer: TextRankSummarizer

    @InjectMocks
    private lateinit var summarizer: MarkdownSummarizer

    private fun setupRankReturnAll(sentences: List<String>) {
        whenever(textRankSummarizer.rank(any())).thenAnswer { inv ->
            val list = inv.getArgument<List<String>>(0)
            list.indices.toList()
        }
    }

    @Test
    fun `should include headings in summary`() {
        val markdown = """
            # Introduction
            This is the introduction content for testing purposes.
            ## Features
            This feature section describes all available features.
        """.trimIndent()
        setupRankReturnAll(emptyList())

        val result = summarizer.summarize(markdown)

        assertContains(result, "# Introduction")
        assertContains(result, "## Features")
    }

    @Test
    fun `should include only TextRank selected sentences`() {
        val markdown = """
            # Title
            First sentence is important content here. Second sentence is also relevant content. Third sentence is noise.
        """.trimIndent()

        // TextRank가 첫 번째 문장(인덱스 0)만 중요하다고 반환
        whenever(textRankSummarizer.rank(any())).thenReturn(listOf(0))

        val result = summarizer.summarize(markdown)

        assertContains(result, "First sentence is important content here.")
        assertFalse(result.contains("Third sentence is noise"))
    }

    @Test
    fun `should preserve list items regardless of TextRank`() {
        val markdown = """
            ## Features
            Some introductory text for this section.
            - Feature one is very useful
            - Feature two is also great
            - Feature three rounds it out
        """.trimIndent()
        setupRankReturnAll(emptyList())

        val result = summarizer.summarize(markdown)

        assertContains(result, "- Feature one is very useful")
        assertContains(result, "- Feature two is also great")
        assertContains(result, "- Feature three rounds it out")
    }

    @Test
    fun `should remove code blocks`() {
        val markdown = """
            # Usage
            Install the library first with proper configuration.
            ```kotlin
            val x = doSomething()
            println(x)
            ```
            Then configure it as needed.
        """.trimIndent()
        setupRankReturnAll(emptyList())

        val result = summarizer.summarize(markdown)

        assertFalse(result.contains("val x = doSomething()"))
        assertFalse(result.contains("println(x)"))
    }

    @Test
    fun `should respect maxChars limit`() {
        val longMarkdown = (1..50).joinToString("\n\n") { i ->
            "## Section $i\nThis is a long paragraph for section $i with enough text to fill space properly."
        }
        whenever(textRankSummarizer.rank(any())).thenAnswer { inv ->
            val list = inv.getArgument<List<String>>(0)
            list.indices.toList()
        }

        val result = summarizer.summarize(longMarkdown, maxChars = 500)

        assertTrue(result.length <= 500)
    }

    @Test
    fun `should handle markdown with only lists and no prose`() {
        val markdown = """
            ## Steps
            - Step one is here
            - Step two is here
            - Step three is here
        """.trimIndent()

        val result = summarizer.summarize(markdown)

        assertContains(result, "## Steps")
        assertContains(result, "- Step one is here")
    }
}
